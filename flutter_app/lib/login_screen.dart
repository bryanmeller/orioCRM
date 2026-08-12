import 'package:flutter/material.dart';
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
  final _codeController = TextEditingController();
  final _userController = TextEditingController();
  final _passController = TextEditingController();

  final _codeFocusNode = FocusNode();
  final _userFocusNode = FocusNode();
  final _passFocusNode = FocusNode();
  final _loginFocusNode = FocusNode();
  final _firstKeyboardKeyFocusNode = FocusNode();

  bool _isLoading = false;
  String? _errorMessage;
  int _activeFieldIndex = 0;
  bool _shiftKeyboard = false;

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
    _firstKeyboardKeyFocusNode.dispose();
    super.dispose();
  }

  TextEditingController get _activeController {
    return [
      _codeController,
      _userController,
      _passController
    ][_activeFieldIndex];
  }

  FocusNode get _activeFieldFocusNode {
    return [_codeFocusNode, _userFocusNode, _passFocusNode][_activeFieldIndex];
  }

  void _selectField(int index, {bool moveToKeyboard = false}) {
    setState(() => _activeFieldIndex = index);
    final targetFocus =
        moveToKeyboard ? _firstKeyboardKeyFocusNode : _activeFieldFocusNode;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        targetFocus.requestFocus();
      }
    });
  }

  void _appendToActiveField(String value) {
    final controller = _activeController;
    controller.text = '${controller.text}$value';
    controller.selection =
        TextSelection.collapsed(offset: controller.text.length);
    setState(() {});
  }

  void _backspaceActiveField() {
    final controller = _activeController;
    if (controller.text.isEmpty) {
      return;
    }
    controller.text = controller.text.substring(0, controller.text.length - 1);
    controller.selection =
        TextSelection.collapsed(offset: controller.text.length);
    setState(() {});
  }

  void _clearActiveField() {
    _activeController.clear();
    setState(() {});
  }

  void _goToNextLoginTarget() {
    if (_activeFieldIndex < 2) {
      _selectField(_activeFieldIndex + 1);
    } else {
      _loginFocusNode.requestFocus();
    }
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
          _buildTvTextField(
            index: 0,
            label: 'Codigo',
            icon: Icons.vpn_key,
            controller: _codeController,
            focusNode: _codeFocusNode,
            autofocus: true,
          ),
          const SizedBox(height: 12),
          _buildTvTextField(
            index: 1,
            label: 'Usuario',
            icon: Icons.person,
            controller: _userController,
            focusNode: _userFocusNode,
          ),
          const SizedBox(height: 12),
          _buildTvTextField(
            index: 2,
            label: 'Senha',
            icon: Icons.lock,
            controller: _passController,
            focusNode: _passFocusNode,
            obscure: true,
          ),
          const SizedBox(height: 16),
          _buildTvKeyboard(),
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

  Widget _buildTvTextField({
    required int index,
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required FocusNode focusNode,
    bool autofocus = false,
    bool obscure = false,
  }) {
    final value = controller.text;
    final isActive = _activeFieldIndex == index;
    final displayValue = obscure && value.isNotEmpty
        ? List.filled(
                value.length.clamp(4, 12).toInt(), String.fromCharCode(8226))
            .join()
        : value;

    return TvFocusable(
      focusNode: focusNode,
      autofocus: autofocus,
      onPressed: () => _selectField(index, moveToKeyboard: true),
      onFocusChange: (focused) {
        if (focused && _activeFieldIndex != index) {
          setState(() => _activeFieldIndex = index);
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        height: 62,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: tvFocusDecoration(
          focused: focused || isActive,
          baseColor: const Color(0xFF14141A),
          radius: 16,
          borderColor: Colors.white12,
          focusedColor:
              focused ? const Color(0xFFB47CFF) : const Color(0xFF6A00FF),
        ),
        child: Row(
          children: [
            Icon(icon,
                color: focused || isActive
                    ? const Color(0xFFB47CFF)
                    : Colors.grey),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                displayValue.isEmpty ? label : displayValue,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: displayValue.isEmpty ? Colors.white54 : Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTvKeyboard() {
    final rows = _shiftKeyboard
        ? const [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', '_'],
          ]
        : const [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '_'],
          ];

    return FocusTraversalGroup(
      policy: ReadingOrderTraversalPolicy(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) ...[
            Row(
              children: [
                for (var keyIndex = 0;
                    keyIndex < rows[rowIndex].length;
                    keyIndex++) ...[
                  Expanded(
                    child: _buildKeyboardKey(
                      rows[rowIndex][keyIndex],
                      focusNode: rowIndex == 0 && keyIndex == 0
                          ? _firstKeyboardKeyFocusNode
                          : null,
                      onPressed: () =>
                          _appendToActiveField(rows[rowIndex][keyIndex]),
                    ),
                  ),
                  if (keyIndex < rows[rowIndex].length - 1)
                    const SizedBox(width: 6),
                ],
              ],
            ),
            const SizedBox(height: 6),
          ],
          Row(
            children: [
              Expanded(
                child: _buildKeyboardKey(
                  _shiftKeyboard ? 'abc' : 'ABC',
                  onPressed: () =>
                      setState(() => _shiftKeyboard = !_shiftKeyboard),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                  flex: 2,
                  child: _buildKeyboardKey('Espaco',
                      onPressed: () => _appendToActiveField(' '))),
              const SizedBox(width: 6),
              Expanded(
                  child: _buildKeyboardKey('Apagar',
                      onPressed: _backspaceActiveField)),
              const SizedBox(width: 6),
              Expanded(
                  child: _buildKeyboardKey('Limpar',
                      onPressed: _clearActiveField)),
              const SizedBox(width: 6),
              Expanded(
                  child: _buildKeyboardKey('Proximo',
                      onPressed: _goToNextLoginTarget)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKeyboardKey(
    String label, {
    required VoidCallback onPressed,
    FocusNode? focusNode,
  }) {
    return TvFocusable(
      focusNode: focusNode,
      onPressed: onPressed,
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 110),
        height: 34,
        alignment: Alignment.center,
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: focused ? Colors.white : const Color(0xFF1A1B22),
          radius: 8,
          borderColor: Colors.white10,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: focused ? const Color(0xFF6A00FF) : Colors.white,
            fontSize: label.length > 6 ? 10 : 13,
            fontWeight: FontWeight.bold,
          ),
        ),
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
