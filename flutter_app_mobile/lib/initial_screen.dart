import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'device_info.dart';
import 'api_service.dart';
import 'tv_focus.dart';
import 'tv_safe_area.dart';

class InitialScreen extends StatefulWidget {
  const InitialScreen({super.key});

  @override
  State<InitialScreen> createState() => _InitialScreenState();
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

  Future<void> _goToLogin() async {
    final hasSavedSession = await ApiService.validateSavedSession(
      deviceId: _deviceId,
      revalidateWithServer: true,
    );
    if (!mounted) {
      return;
    }

    if (hasSavedSession) {
      Navigator.of(context).pushReplacementNamed('/home');
      return;
    }

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
                    const Color(0xFF6A00FF).withValues(alpha: 0.25),
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
                    const Color(0xFF00D8C9).withValues(alpha: 0.18),
                    Colors.transparent
                  ],
                ),
              ),
            ),
          ),
          TvOverscanSafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final availableWidth = constraints.maxWidth - 16;
                final contentWidth = availableWidth < 680
                    ? availableWidth
                    : availableWidth.clamp(680.0, 1080.0).toDouble();
                final isCompactHeight = constraints.maxHeight < 460;
                return Center(
                  child: SingleChildScrollView(
                    padding:
                        const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                    child: Container(
                      width: contentWidth,
                      padding: EdgeInsets.all(isCompactHeight ? 14 : 18),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B0B0F),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: Colors.white10),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.45),
                            blurRadius: 40,
                            offset: const Offset(0, 20),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: isCompactHeight ? 76 : 92,
                                height: isCompactHeight ? 50 : 58,
                                child: Image.asset(
                                  'assets/images/orio_logo.png',
                                  fit: BoxFit.contain,
                                  alignment: Alignment.centerLeft,
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: isCompactHeight ? 12 : 14,
                                  vertical: isCompactHeight ? 8 : 10,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF141414),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: const Color(0xFF6A00FF)
                                          .withValues(alpha: 0.3)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Device ID',
                                      style: TextStyle(
                                          color: Colors.white54, fontSize: 10),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _deviceId,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: isCompactHeight ? 12 : 16),
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
                                    const Center(
                                        child: CircularProgressIndicator())
                                  else
                                    Text(
                                      _trialError,
                                      style: const TextStyle(
                                          color: Colors.tealAccent,
                                          fontSize: 15),
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
                                              color: Colors.white70,
                                              fontSize: 13),
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
                                              style: TextStyle(
                                                  color: Colors.white)),
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
                                                  content: Text(
                                                      'Device ID Copiado!')),
                                            );
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor:
                                                const Color(0xFF6A00FF),
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 16),
                                          ),
                                          child: const Text(
                                              'Copiar Identificador'),
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
                                    subtitle: 'Acessar',
                                    description: 'Entrar com codigo e senha.',
                                    buttonText: 'ENTRAR',
                                    color: const Color(0xFF6A00FF),
                                    onTap: _goToLogin,
                                    autofocus: true,
                                    compact: isCompactHeight,
                                  ),
                                ),
                                SizedBox(width: isCompactHeight ? 10 : 14),
                                Expanded(
                                  child: _buildOptionCard(
                                    title: 'NÃO TENHO LICENÇA',
                                    subtitle: 'Teste',
                                    description: 'Solicitar acesso de teste.',
                                    buttonText: 'VER',
                                    color: Colors.teal,
                                    onTap: _handleNoLicense,
                                    autofocus: false,
                                    compact: isCompactHeight,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              },
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
    bool compact = false,
  }) {
    return TvFocusable(
      autofocus: autofocus,
      onPressed: onTap,
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: EdgeInsets.all(compact ? 12 : 14),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF111318),
          radius: 18,
          borderColor: color.withValues(alpha: 0.25),
          focusedColor: color,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: compact ? 10 : 12,
                vertical: compact ? 4 : 5,
              ),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                title,
                style: TextStyle(
                  color: color,
                  fontSize: compact ? 10 : 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            SizedBox(height: compact ? 8 : 10),
            Text(
              subtitle,
              style: TextStyle(
                  color: Colors.white,
                  fontSize: compact ? 17 : 19,
                  fontWeight: FontWeight.bold),
            ),
            SizedBox(height: compact ? 4 : 6),
            Text(
              description,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.grey,
                fontSize: compact ? 11 : 12,
                height: 1.2,
              ),
            ),
            SizedBox(height: compact ? 10 : 12),
            SizedBox(
              width: double.infinity,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 140),
                padding: EdgeInsets.symmetric(vertical: compact ? 9 : 11),
                decoration: BoxDecoration(
                  color: focused ? Colors.white : color,
                  borderRadius: BorderRadius.circular(14),
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
                        fontSize: compact ? 13 : 14),
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
