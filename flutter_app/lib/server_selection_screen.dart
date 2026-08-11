import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

    Navigator.of(context).pushReplacementNamed('/home');
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final contentWidth = screenWidth.clamp(720.0, 900.0);

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Center(
          child: Container(
            width: contentWidth,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF111111),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: FocusTraversalGroup(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Selecionar Servidor',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Sua licença possui acesso a múltiplos servidores.',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  ListView.separated(
                    shrinkWrap: true,
                    itemCount: dnsList.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final server = dnsList[index];
                      return ElevatedButton(
                        onPressed: () => _selectServer(context, server),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF222222),
                          padding: const EdgeInsets.symmetric(
                              vertical: 18, horizontal: 20),
                          alignment: Alignment.centerLeft,
                        ).copyWith(
                          side: MaterialStateProperty.resolveWith((states) {
                            return BorderSide(
                              color: states.contains(MaterialState.focused)
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
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
