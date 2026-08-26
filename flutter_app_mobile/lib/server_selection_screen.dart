import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'tv_safe_area.dart';

class ServerSelectionScreen extends StatelessWidget {
  final List<dynamic> dnsList;

  const ServerSelectionScreen({Key? key, required this.dnsList})
      : super(key: key);

  Future<void> _selectServer(
      BuildContext context, Map<String, dynamic> server) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_server_id', server['id'] ?? '');
    await prefs.setString('selected_server_url',
        server['url'] ?? server['baseUrl'] ?? server['server_url'] ?? '');
    await prefs.setString('selected_server_name',
        server['display_name'] ?? server['name'] ?? 'Servidor');

    if (!context.mounted) {
      return;
    }
    Navigator.of(context).pushReplacementNamed('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: TvOverscanSafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final contentWidth = constraints.maxWidth < 720
                ? constraints.maxWidth
                : constraints.maxWidth.clamp(720.0, 900.0).toDouble();

            return Center(
              child: Container(
                width: contentWidth,
                constraints: BoxConstraints(maxHeight: constraints.maxHeight),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF111111),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: FocusTraversalGroup(
                  child: Column(
                    children: [
                      const Text(
                        'Selecionar Servidor',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Sua licenca possui acesso a multiplos servidores.',
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 18),
                      Expanded(
                        child: ListView.separated(
                          itemCount: dnsList.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final server = dnsList[index];
                            return ElevatedButton(
                              onPressed: () => _selectServer(context, server),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF222222),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                  horizontal: 18,
                                ),
                                alignment: Alignment.centerLeft,
                              ).copyWith(
                                side: WidgetStateProperty.resolveWith((states) {
                                  return BorderSide(
                                    color: states.contains(WidgetState.focused)
                                        ? Colors.white
                                        : Colors.transparent,
                                    width: 2,
                                  );
                                }),
                              ),
                              child: Text(
                                server['display_name'] ??
                                    server['name'] ??
                                    'Servidor ${index + 1}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
