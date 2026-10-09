import 'package:flutter/material.dart';

import 'api_service.dart';
import 'app_language.dart';

Future<void> showPendingAuthorizationNotice(BuildContext context) async {
  final message = await ApiService.consumeAuthorizationNotice();
  if (message == null || !context.mounted) {
    return;
  }

  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      title: Text(
        AppLanguage.text('Acesso nao autorizado', 'Unauthorized access'),
      ),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(AppLanguage.text('Entendi', 'Got it')),
        ),
      ],
    ),
  );
}
