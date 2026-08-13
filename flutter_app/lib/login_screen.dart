import 'package:flutter/material.dart';
import 'package:android_tv_text_field/native_textfield_tv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'server_selection_screen.dart';
import 'device_info.dart';
import 'tv_focus.dart';

class LoginScreen extends StatefulWidget {
  final String deviceId;
  const LoginScreen({Key? key, required this.deviceId}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _codeController = NativeTextFieldController();
  final _userController = NativeTextFieldController();
  final _passController = NativeTextFieldController();

  final _codeFocusNode = FocusNode();
  final _userFocusNode = FocusNode();
  final _passFocusNode = FocusNode();
  final _loginFocusNode = FocusNode();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        FocusScope.of(context).requestFocus(_codeFocusNode);
        Future.delayed(const Duration(milliseconds: 120), () {
          if (mounted) {
            FocusScope.of(context).requestFocus(_codeFocusNode);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _codeController.dispose();
    _userController.dispose();
    _passController.dispose();
    _codeFocusNode.dispose();
    _userFocusNode.dispose();
    _passFocusNode.dispose();
    _loginFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final code = _codeController.text.trim();
    final user = _userController.text.trim();
    final pass = _passController.text.trim();

    if (code.isEmpty || user.isEmpty || pass.isEmpty) {
      setState(() {
        _errorMessage = 'Preencha todos os campos.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final info = await DeviceInfoHelper.getDeviceInfoDetails();
      final response = await ApiService.loginApp(
        licenseCode: code,
        username: user,
        password: pass,
        deviceId: widget.deviceId,
        deviceInfo: info,
      );

      final dnsList = response['servers'] as List<dynamic>? ?? [];

      if (dnsList.isEmpty) {
        setState(() {
          _errorMessage = 'Nenhum servidor autorizado encontrado.';
        });
      } else if (dnsList.length == 1) {
        final server = dnsList.first;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('selected_server_id', server['id'] ?? '');
        await prefs.setString('selected_server_url',
            server['url'] ?? server['baseUrl'] ?? server['server_url'] ?? '');
        await prefs.setString('selected_server_name',
            server['display_name'] ?? server['name'] ?? 'Servidor');

        Navigator.of(context).pushReplacementNamed('/home');
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ServerSelectionScreen(dnsList: dnsList),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isWideLayout = screenWidth > 900;
    final contentWidth = screenWidth.clamp(760.0, 1120.0);
    final contentHeight = (screenHeight - 40).clamp(560.0, 760.0).toDouble();

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned(
            left: -140,
            top: -120,
            child: Container(
              width: 420,
              height: 420,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF6A00FF).withOpacity(0.22),
                    Colors.transparent
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            right: -200,
            bottom: -180,
            child: Container(
              width: 520,
              height: 520,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF00D8C9).withOpacity(0.16),
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
                    const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                child: Container(
                  width: contentWidth,
                  height: isWideLayout ? contentHeight : null,
                  constraints: BoxConstraints(
                    minHeight: isWideLayout ? contentHeight : 0,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0C0C10),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: isWideLayout
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              flex: 5,
                              child: _buildInfoPanel(context),
                            ),
                            Expanded(
                              flex: 4,
                              child: _buildLoginPanel(context),
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildInfoPanel(context),
                            const SizedBox(height: 24),
                            _buildLoginPanel(context),
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

  Widget _buildInfoPanel(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF08080A), Color(0xFF12101A)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'STREAMFLIX TV',
            style: TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Plataforma Leanback para Android TV e Fire TV',
            style: TextStyle(
                color: Colors.purpleAccent,
                fontSize: 14,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          const Text(
            'Acesse seu assino com a mesma aparência do simulador web e navegue em telas otimizadas para televisão. Sem controle remoto visível, apenas a interface limpa do conteúdo.',
            style: TextStyle(color: Colors.white70, fontSize: 15, height: 1.6),
          ),
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF101118),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Destaques',
                    style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 12),
                _buildFeatureItem(
                    Icons.shield, 'Interface Leanback escura e elegante'),
                const SizedBox(height: 10),
                _buildFeatureItem(Icons.tv,
                    'Tela de login rica em painel e estilo de app TV'),
                const SizedBox(height: 10),
                _buildFeatureItem(Icons.language,
                    'Sem overlay de controle remoto no Flutter'),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'Device ID: ${widget.deviceId}',
            style: const TextStyle(
                color: Colors.white54, fontSize: 13, letterSpacing: 1.2),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginPanel(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Login de Acesso',
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.start,
          ),
          const SizedBox(height: 8),
          const Text(
            'Informe seu Codigo, Usuario e Senha para entrar.',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 20),
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _errorMessage!,
                style: const TextStyle(color: Colors.redAccent, fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 14),
          ],
          _buildNativeInputField(
            label: 'Codigo',
            controller: _codeController,
            focusNode: _codeFocusNode,
            nextFocusNode: _userFocusNode,
          ),
          const SizedBox(height: 12),
          _buildNativeInputField(
            label: 'Usuario',
            controller: _userController,
            focusNode: _userFocusNode,
            nextFocusNode: _passFocusNode,
          ),
          const SizedBox(height: 12),
          _buildNativeInputField(
            label: 'Senha',
            controller: _passController,
            focusNode: _passFocusNode,
            nextFocusNode: _loginFocusNode,
            obscure: true,
          ),
          const SizedBox(height: 16),
          TvFocusable(
            focusNode: _loginFocusNode,
            enabled: !_isLoading,
            onPressed: _handleLogin,
            builder: (context, focused) => AnimatedContainer(
              duration: const Duration(milliseconds: 140),
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: tvFocusDecoration(
                focused: focused,
                baseColor: focused ? Colors.white : const Color(0xFF6A00FF),
                radius: 18,
                focusedColor: const Color(0xFFB47CFF),
              ),
              child: Center(
                child: _isLoading
                    ? SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          color:
                              focused ? const Color(0xFF6A00FF) : Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'ENTRAR NO STREAMFLIX',
                        style: TextStyle(
                          color:
                              focused ? const Color(0xFF6A00FF) : Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNativeInputField({
    required String label,
    required NativeTextFieldController controller,
    required FocusNode focusNode,
    FocusNode? nextFocusNode,
    bool obscure = false,
  }) {
    return SizedBox(
      height: 64,
      child: AndroidTVTextField(
        focusNode: focusNode,
        controller: controller,
        hint: label,
        obscureText: obscure,
        onSubmitted: (_) {
          if (nextFocusNode != null) {
            nextFocusNode.requestFocus();
            return;
          }
          _handleLogin();
        },
        backgroundColor: const Color(0xFF14141A),
        textColor: Colors.white,
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String label) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: const Color(0xFF1B1B24),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFF6A00FF), size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
                color: Colors.white70, fontSize: 14, height: 1.4),
          ),
        ),
      ],
    );
  }
}
