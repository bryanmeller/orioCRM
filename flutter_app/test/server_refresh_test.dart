import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:streamflix_tv/api_service.dart';

void main() {
  void seedProvider() {
    SharedPreferences.setMockInitialValues({
      'auth_token': 'old-token',
      'user_data': jsonEncode({
        'role': 'PROVIDER',
        'provider_code': '123456',
      }),
      'servers_data': jsonEncode([
        {
          'id': 'old-dns',
          'name': 'DNS antigo',
          'url': 'https://old.example',
          'username': 'xtream-user',
          'password': 'xtream-password',
        },
      ]),
      'selected_server_id': 'old-dns',
    });
  }

  test('provider refresh logs in once and selects the new authorized DNS',
      () async {
    seedProvider();
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      expect(request.url.path, '/api/v1/auth/app/login');
      expect(request.headers['Accept'], 'application/json');
      expect(jsonDecode(request.body), {
        'licenseCode': '123456',
        'username': 'xtream-user',
        'password': 'xtream-password',
        'deviceId': 'device-1',
      });
      return http.Response(
        jsonEncode({
          'success': true,
          'token': 'new-token',
          'selected_server': {
            'id': 'new-dns',
            'url': 'https://new.example',
          },
          'servers': [
            {
              'id': 'new-dns',
              'name': 'DNS novo',
              'url': 'https://new.example',
              'username': 'xtream-user',
              'password': 'xtream-password',
            },
          ],
        }),
        200,
      );
    });

    expect(
      await ApiService.refreshSavedSession(
        deviceId: 'device-1',
        client: client,
      ),
      isTrue,
    );
    expect(calls, 1);
    expect((await ApiService.getActiveServer())?.id, 'new-dns');
    expect((await ApiService.getSavedServers()).single.name, 'DNS novo');
    expect(await ApiService.getToken(), 'new-token');
    client.close();
  });

  test('technical failure preserves the previous DNS and session', () async {
    seedProvider();
    final client = MockClient(
      (request) async => http.Response('{"error":"unavailable"}', 503),
    );

    expect(
      await ApiService.refreshSavedSession(
        deviceId: 'device-1',
        client: client,
      ),
      isFalse,
    );
    expect((await ApiService.getActiveServer())?.id, 'old-dns');
    expect(await ApiService.getToken(), 'old-token');
    client.close();
  });

  test('malformed provider success does not remove the previous DNS', () async {
    seedProvider();
    final client = MockClient((request) async =>
        http.Response('{"success":true,"token":"new-token"}', 200));

    expect(
      await ApiService.refreshSavedSession(
        deviceId: 'device-1',
        client: client,
      ),
      isFalse,
    );
    expect((await ApiService.getActiveServer())?.id, 'old-dns');
    expect(await ApiService.getToken(), 'old-token');
    client.close();
  });

  test('individual license still uses device login', () async {
    SharedPreferences.setMockInitialValues({
      'auth_token': 'old-token',
      'user_data': '{"role":"USER"}',
    });
    final client = MockClient((request) async {
      expect(request.url.path, '/v1/auth/app/device-login');
      expect(jsonDecode(request.body), {'deviceId': 'device-1'});
      return http.Response('{"success":true,"token":"new-token"}', 200);
    });

    expect(
      await ApiService.refreshSavedSession(
        deviceId: 'device-1',
        client: client,
      ),
      isTrue,
    );
    expect(await ApiService.getToken(), 'new-token');
    client.close();
  });

  test('provider refresh honors Retry-After without another login', () async {
    seedProvider();
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      return http.Response(
        '{"error":"too many requests"}',
        429,
        headers: {'retry-after': '60'},
      );
    });

    expect(
      await ApiService.refreshSavedSession(
        deviceId: 'device-1',
        client: client,
      ),
      isFalse,
    );
    expect(
      await ApiService.refreshSavedSession(
        deviceId: 'device-1',
        client: client,
      ),
      isFalse,
    );
    expect(calls, 1);
    expect(await ApiService.getToken(), 'old-token');
    client.close();
  });

  test('concurrent individual session validation shares device login',
      () async {
    SharedPreferences.setMockInitialValues({
      'auth_token': 'saved-token',
      'user_data': '{"role":"USER"}',
      'license_data': jsonEncode({
        'code': 'INDIVIDUAL',
        'status': 'ACTIVE',
        'expires_at': '2027-10-08T13:39:03.742+00:00',
      }),
      'servers_data': jsonEncode([
        {
          'id': 'server-1',
          'url': 'https://iptv.example',
          'username': 'user',
          'password': 'password',
        },
      ]),
    });
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
    response.complete(http.Response(
        jsonEncode({
          'success': true,
          'token': 'renewed-token',
          'license': {
            'code': 'INDIVIDUAL',
            'status': 'ACTIVE',
            'expires_at': '2027-10-08T13:39:03.742+00:00',
          },
          'servers': [
            {
              'id': 'server-1',
              'url': 'https://iptv.example',
              'username': 'user',
              'password': 'password',
            },
          ],
        }),
        200));

    expect(await Future.wait([first, second]), [true, true]);
    expect(calls, 1);
    client.close();
  });
}
