import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'device_info.dart';
import 'api_service.dart';
import 'authorization_notice.dart';
import 'app_language.dart';
import 'tv_focus.dart';
import 'tv_safe_area.dart';

class InitialScreen extends StatefulWidget {
  @override
  _InitialScreenState createState() => _InitialScreenState();
}

class _InitialScreenState extends State<InitialScreen> {
  String _deviceId = AppLanguage.text('Carregando...', 'Loading...');
  bool _showNoLicenseInfo = false;
  bool _isLoadingTrial = false;
  String _trialError = '';

  @override
  void initState() {
    super.initState();
    _loadDeviceId();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        showPendingAuthorizationNotice(context);
      }
    });
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
          _trialError = AppLanguage.text(
            'Trial ativado com sucesso! Verifique seu codigo: ${result['licenseCode']}. Os pagamentos online estao temporariamente indisponiveis. Cadastre-se no site ou entre em contato com um revendedor para ativar sua licenca apos o periodo.',
            'Trial activated successfully! Your code is: ${result['licenseCode']}. Online payments are temporarily unavailable. Sign up on the website or contact a reseller to activate your license after the trial.',
          );
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingTrial = false;
        _trialError = AppLanguage.text(
          'Falha ao solicitar trial: ${e.toString()}\nOs pagamentos online estao temporariamente indisponiveis. Cadastre-se no site ou entre em contato com um revendedor para ativar sua licenca.',
          'Unable to request a trial: ${e.toString()}\nOnline payments are temporarily unavailable. Sign up on the website or contact a reseller to activate your license.',
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

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
          TvOverscanSafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final availableWidth = constraints.maxWidth - 16;
                final contentWidth = availableWidth < 680
                    ? availableWidth
                    : availableWidth.clamp(680.0, 1080.0).toDouble();
                return Center(
                  child: SingleChildScrollView(
                    padding:
                        const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                    child: Container(
                      width: contentWidth,
                      padding: const EdgeInsets.all(20),
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
                                  children: [
                                    SizedBox(
                                      width: screenWidth > 900 ? 180 : 150,
                                      height: screenWidth > 900 ? 58 : 48,
                                      child: Image.asset(
                                        'assets/images/orio_logo.png',
                                        fit: BoxFit.contain,
                                        alignment: Alignment.centerLeft,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      AppLanguage.text(
                                        'Aplicativo Android TV & Fire TV',
                                        'Android TV & Fire TV App',
                                      ),
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      AppLanguage.text(
                                        'Use o aplicativo com a mesma aparencia do simulador web, sem o painel de controle remoto. Faca login rapidamente e navegue pela TV com foco simplificado.',
                                        'Use the app with the same look as the web simulator, without the remote-control panel. Sign in quickly and browse on your TV with simple navigation.',
                                      ),
                                      style: const TextStyle(
                                        color: Colors.grey,
                                        fontSize: 14,
                                        height: 1.35,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 18),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 18, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF141414),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: const Color(0xFF6A00FF)
                                          .withOpacity(0.3)),
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
                          const SizedBox(height: 20),
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
                                  Text(
                                    AppLanguage.text(
                                      'Sem Licenca Ativa',
                                      'No Active License',
                                    ),
                                    style: const TextStyle(
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
                                        Text(
                                          AppLanguage.text(
                                            'Identificador do dispositivo',
                                            'Device Identifier',
                                          ),
                                          style: const TextStyle(
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
                                          child: Text(
                                              AppLanguage.text(
                                                'Voltar',
                                                'Back',
                                              ),
                                              style: const TextStyle(
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
                                              SnackBar(
                                                content: Text(
                                                  AppLanguage.text(
                                                    'Device ID copiado!',
                                                    'Device ID copied!',
                                                  ),
                                                ),
                                              ),
                                            );
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor:
                                                const Color(0xFF6A00FF),
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 16),
                                          ),
                                          child: Text(
                                            AppLanguage.text(
                                              'Copiar Identificador',
                                              'Copy Identifier',
                                            ),
                                          ),
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
                                    title: AppLanguage.text(
                                      'JA TENHO LICENCA',
                                      'I HAVE A LICENSE',
                                    ),
                                    subtitle: AppLanguage.text(
                                      'Acessar o Aplicativo',
                                      'Access the App',
                                    ),
                                    description: AppLanguage.text(
                                      'Informe seu Codigo, Usuario e Senha para autenticar.',
                                      'Enter your Code, Username and Password to sign in.',
                                    ),
                                    buttonText:
                                        AppLanguage.text('ENTRAR', 'SIGN IN'),
                                    color: const Color(0xFF6A00FF),
                                    onTap: _goToLogin,
                                    autofocus: true,
                                  ),
                                ),
                                const SizedBox(width: 18),
                                Expanded(
                                  child: _buildOptionCard(
                                    title: AppLanguage.text(
                                      'NAO TENHO LICENCA',
                                      "I DON'T HAVE A LICENSE",
                                    ),
                                    subtitle: AppLanguage.text(
                                      'Adquira sua Licenca',
                                      'Get Your License',
                                    ),
                                    description: AppLanguage.text(
                                      'Acesse o teste gratis ou compre uma licenca.',
                                      'Start a free trial or purchase a license.',
                                    ),
                                    buttonText: AppLanguage.text(
                                      'VER DETALHES',
                                      'VIEW DETAILS',
                                    ),
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
  }) {
    return TvFocusable(
      autofocus: autofocus,
      onPressed: onTap,
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: const EdgeInsets.all(18),
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
            const SizedBox(height: 14),
            Text(
              subtitle,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                  color: Colors.grey, fontSize: 14, height: 1.35),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 140),
                padding: const EdgeInsets.symmetric(vertical: 14),
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
