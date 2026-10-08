import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:streamflix_tv/api_service.dart';
import 'package:streamflix_tv/authorization_notice.dart';

void main() {
  const providerCode = '123456';

  void seedSession({String token = 'test-token', bool withServer = false}) {
    SharedPreferences.setMockInitialValues({
      'auth_token': token,
      'user_data': jsonEncode({
        'role': 'PROVIDER',
        'provider_code': providerCode,
      }),
      if (withServer) ...{
        'selected_server_id': 'server-1',
        'servers_data': jsonEncode([
          {
            'id': 'server-1',
            'url': 'https://iptv.example',
            'username': 'xtream-user',
            'password': 'xtream-password',
          },
        ]),
      },
    });
  }

  test('checks provider once, then reuses the daily authorization', () async {
    seedSession();
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      expect(request.url.path, '/api/v1/provider/license/status');
      expect(request.headers['Authorization'], 'Bearer test-token');
      expect(jsonDecode(request.body), {'providerCode': providerCode});
      return http.Response(
        jsonEncode({
          'provider_status': 'ACTIVE',
          'access_allowed': true,
          'next_check_seconds': 86400,
        }),
        200,
      );
    });

    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isTrue,
    );
    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isTrue,
    );
    expect(calls, 1);
    client.close();
  });

  test('uses the provider code from JWT when user data omits it', () async {
    final token = [
      base64Url.encode(utf8.encode('{"alg":"none"}')),
      base64Url.encode(utf8.encode(jsonEncode({
        'providerCode': providerCode,
        'exp': DateTime.now().millisecondsSinceEpoch ~/ 1000 + 3600,
      }))),
      'signature',
    ].join('.');
    SharedPreferences.setMockInitialValues({
      'auth_token': token,
      'user_data': '{"role":"PROVIDER"}',
    });
    final client = MockClient((request) async {
      expect(jsonDecode(request.body), {'providerCode': providerCode});
      return http.Response('{"access_allowed":true}', 200);
    });

    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isTrue,
    );
    client.close();
  });

  test('revoked provider is logged out and receives a one-time notice',
      () async {
    seedSession();
    final client = MockClient((request) async => http.Response(
          jsonEncode({
            'provider_status': 'BLOCKED',
            'access_allowed': false,
            'reason': 'PAYMENT_OVERDUE',
          }),
          200,
        ));

    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isFalse,
    );
    expect(await ApiService.getToken(), isNull);
    expect(
      await ApiService.consumeAuthorizationNotice(),
      contains('revendedor ou provedor'),
    );
    expect(await ApiService.consumeAuthorizationNotice(), isNull);
    client.close();
  });

  test('temporary API failure keeps the session and retries next time',
      () async {
    seedSession();
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      return http.Response('{"error":"unavailable"}', 503);
    });

    for (var attempt = 0; attempt < 2; attempt++) {
      expect(
        await ApiService.validateSavedSession(
          deviceId: 'device-1',
          revalidateWithServer: true,
          client: client,
        ),
        isTrue,
      );
    }
    expect(calls, 2);
    expect(await ApiService.getToken(), 'test-token');
    client.close();
  });

  test('expired token is renewed before the provider status request', () async {
    final expiredToken = [
      base64Url.encode(utf8.encode('{"alg":"none"}')),
      base64Url.encode(utf8.encode('{"exp":1}')),
      'signature',
    ].join('.');
    seedSession(token: expiredToken, withServer: true);
    final requests = <String>[];
    final client = MockClient((request) async {
      requests.add(request.url.path);
      if (request.url.path == '/api/v1/auth/app/login') {
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body['licenseCode'], providerCode);
        expect(body['username'], 'xtream-user');
        expect(body['deviceId'], 'device-1');
        return http.Response('{"success":true,"token":"renewed-token"}', 200);
      }
      expect(request.headers['Authorization'], 'Bearer renewed-token');
      return http.Response(
        '{"provider_status":"ACTIVE","access_allowed":true}',
        200,
      );
    });

    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isTrue,
    );
    expect(requests, [
      '/api/v1/auth/app/login',
      '/api/v1/provider/license/status',
    ]);
    expect(await ApiService.getToken(), 'renewed-token');
    client.close();
  });

  test('provider code rejected during token renewal revokes the session',
      () async {
    final expiredToken = [
      base64Url.encode(utf8.encode('{"alg":"none"}')),
      base64Url.encode(utf8.encode('{"exp":1}')),
      'signature',
    ].join('.');
    seedSession(token: expiredToken, withServer: true);
    final client = MockClient((request) async {
      expect(request.url.path, '/api/v1/auth/app/login');
      return http.Response(
        '{"success":false,"error":"Código de acesso não reconhecido."}',
        401,
      );
    });

    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isFalse,
    );
    expect(await ApiService.getToken(), isNull);
    expect(await ApiService.consumeAuthorizationNotice(), isNotNull);
    client.close();
  });

  test('401 status renews the token and retries authorization once', () async {
    seedSession(withServer: true);
    final requests = <String>[];
    final client = MockClient((request) async {
      requests.add(request.url.path);
      if (request.url.path == '/api/v1/auth/app/login') {
        return http.Response('{"success":true,"token":"renewed-token"}', 200);
      }
      if (request.headers['Authorization'] == 'Bearer test-token') {
        return http.Response('{"error":"INVALID_TOKEN"}', 401);
      }
      expect(request.headers['Authorization'], 'Bearer renewed-token');
      return http.Response('{"access_allowed":true}', 200);
    });

    expect(
      await ApiService.validateSavedSession(
        deviceId: 'device-1',
        revalidateWithServer: true,
        client: client,
      ),
      isTrue,
    );
    expect(requests, [
      '/api/v1/provider/license/status',
      '/api/v1/auth/app/login',
      '/api/v1/provider/license/status',
    ]);
    client.close();
  });

  test('concurrent access shares one provider status request', () async {
    seedSession();
    final response = Completer<http.Response>();
    var calls = 0;
    final client = MockClient((request) {
      calls++;
      return response.future;
    });

    final first = ApiService.validateSavedSession(
      deviceId: 'device-1',
      revalidateWithServer: true,
      client: client,
    );
    final second = ApiService.validateSavedSession(
      deviceId: 'device-1',
      revalidateWithServer: true,
      client: client,
    );
    await Future<void>.delayed(const Duration(milliseconds: 10));
    response.complete(http.Response('{"access_allowed":true}', 200));

    expect(await Future.wait([first, second]), [true, true]);
    expect(calls, 1);
    client.close();
  });

  testWidgets('revocation notice is visible before the next login',
      (tester) async {
    seedSession();
    final client = MockClient(
        (request) async => http.Response('{"access_allowed":false}', 200));
    await ApiService.validateSavedSession(
      deviceId: 'device-1',
      revalidateWithServer: true,
      client: client,
    );

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () => showPendingAuthorizationNotice(context),
            child: const Text('Mostrar aviso'),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('Mostrar aviso'));
    await tester.pumpAndSettle();

    expect(find.text('Acesso não autorizado'), findsOneWidget);
    expect(find.textContaining('revendedor ou provedor'), findsOneWidget);
    await tester.tap(find.text('Entendi'));
    await tester.pumpAndSettle();
    expect(find.text('Acesso não autorizado'), findsNothing);
    client.close();
  });
}
