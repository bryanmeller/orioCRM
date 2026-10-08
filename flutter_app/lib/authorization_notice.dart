import 'package:flutter/material.dart';

import 'api_service.dart';

Future<void> showPendingAuthorizationNotice(BuildContext context) async {
  final message = await ApiService.consumeAuthorizationNotice();
  if (message == null || !context.mounted) {
    return;
  }

  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Acesso não autorizado'),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Entendi'),
        ),
      ],
    ),
  );
}
