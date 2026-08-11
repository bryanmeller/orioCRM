import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'device_info.dart';
import 'api_service.dart';
import 'tv_focus.dart';

class InitialScreen extends StatefulWidget {
  @override
  _InitialScreenState createState() => _InitialScreenState();
}

class _InitialScreenState extends State<InitialScreen> {
  String _deviceId = 'Carregando...';
  bool _showNoLicenseInfo = false;
  bool _isLoadingTrial = false;
  String _trialError = '';

  @override
  void initState() {
    super.initState();
    _loadDeviceId();
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _goToLogin() {
    Navigator.of(context).pushNamed('/login', arguments: _deviceId);
  }

  Future<void> _loadDeviceId() async {
    final id = await DeviceInfoHelper.getDeviceId();
    setState(() => _deviceId = id);
  }

  Future<void> _handleNoLicense() async {
    setState(() {
      _showNoLicenseInfo = true;
      _isLoadingTrial = true;
      _trialError = '';
    });

    try {
      final info = await DeviceInfoHelper.getDeviceInfoDetails();
      final result = await ApiService.requestTrial(_deviceId, info);
      if (result['success']) {
        // Automatically go to login or show success message with code
        setState(() {
          _isLoadingTrial = false;
          _trialError =
              'Trial ativado com sucesso! Verifique seu código: ${result['licenseCode']}. Os pagamentos online estão temporariamente indisponíveis. Cadastre-se no site ou entre em contato com um revendedor para ativar sua licença após o período.';
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingTrial = false;
        _trialError =
            'Falha ao solicitar trial: ${e.toString()}\nOs pagamentos online estão temporariamente indisponíveis. Cadastre-se no site ou entre em contato com um revendedor para ativar sua licença.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final contentWidth = screenWidth.clamp(760.0, 1160.0);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned(
            left: -120,
            top: -120,
            child: Container(
              width: 420,
              height: 420,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF6A00FF).withOpacity(0.25),
                    Colors.transparent
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            right: -160,
            bottom: -160,
            child: Container(
              width: 520,
              height: 520,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF00D8C9).withOpacity(0.18),
                    Colors.transparent
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                child: Container(
                  width: contentWidth,
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B0B0F),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: Colors.white10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.45),
                        blurRadius: 40,
                        offset: const Offset(0, 20),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'STREAMFLIX TV',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 12),
                                Text(
                                  'Aplicativo Android TV & Fire TV',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 16,
                                  ),
                                ),
                                SizedBox(height: 20),
                                Text(
                                  'Use o aplicativo com a mesma aparência do simulador web, sem o painel de controle remoto. Faça login rapidamente e navegue pela TV com foco simplificado.',
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 15,
                                    height: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 24),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 18, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF141414),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color:
                                      const Color(0xFF6A00FF).withOpacity(0.3)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Device ID',
                                  style: TextStyle(
                                      color: Colors.white70, fontSize: 12),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _deviceId,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      if (_showNoLicenseInfo) ...[
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0xFF111318),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white10),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text(
                                'Sem Licença Ativa',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 18),
                              if (_isLoadingTrial)
                                const Center(child: CircularProgressIndicator())
                              else
                                Text(
                                  _trialError,
                                  style: const TextStyle(
                                      color: Colors.tealAccent, fontSize: 15),
                                  textAlign: TextAlign.center,
                                ),
                              const SizedBox(height: 28),
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0C0D12),
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Column(
                                  children: [
                                    const Text(
                                      'Identificador do dispositivo',
                                      style: TextStyle(
                                          color: Colors.white70, fontSize: 13),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      _deviceId,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 22,
                                        letterSpacing: 1.8,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 28),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () => setState(
                                          () => _showNoLicenseInfo = false),
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(
                                            color: Colors.white10),
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 16),
                                      ),
                                      child: const Text('Voltar',
                                          style:
                                              TextStyle(color: Colors.white)),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {
                                        Clipboard.setData(
                                            ClipboardData(text: _deviceId));
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          const SnackBar(
                                              content:
                                                  Text('Device ID Copiado!')),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor:
                                            const Color(0xFF6A00FF),
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 16),
                                      ),
                                      child: const Text('Copiar Identificador'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )
                      ] else ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _buildOptionCard(
                                title: 'JÁ TENHO LICENÇA',
                                subtitle: 'Acessar o Aplicativo',
                                description:
                                    'Informe seu Código, Usuário e Senha para autenticar.',
                                buttonText: 'ENTRAR',
                                color: const Color(0xFF6A00FF),
                                onTap: _goToLogin,
                                autofocus: true,
                              ),
                            ),
                            const SizedBox(width: 24),
                            Expanded(
                              child: _buildOptionCard(
                                title: 'NÃO TENHO LICENÇA',
                                subtitle: 'Adquira sua Licença',
                                description:
                                    'Acesse o teste grátis ou compre uma licença.',
                                buttonText: 'VER DETALHES',
                                color: Colors.teal,
                                onTap: _handleNoLicense,
                                autofocus: false,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionCard({
    required String title,
    required String subtitle,
    required String description,
    required String buttonText,
    required Color color,
    required VoidCallback onTap,
    required bool autofocus,
  }) {
    return TvFocusable(
      autofocus: autofocus,
      onPressed: onTap,
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: const EdgeInsets.all(24),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF111318),
          radius: 24,
          borderColor: color.withOpacity(0.25),
          focusedColor: color,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                title,
                style: TextStyle(
                    color: color, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              subtitle,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: const TextStyle(
                  color: Colors.grey, fontSize: 15, height: 1.5),
            ),
            const SizedBox(height: 26),
            SizedBox(
              width: double.infinity,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 140),
                padding: const EdgeInsets.symmetric(vertical: 18),
                decoration: BoxDecoration(
                  color: focused ? Colors.white : color,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: focused ? color : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: Text(
                    buttonText,
                    style: TextStyle(
                        color: focused ? color : Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
