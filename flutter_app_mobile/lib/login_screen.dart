import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'server_selection_screen.dart';
import 'device_info.dart';
import 'tv_focus.dart';
import 'tv_safe_area.dart';

class LoginScreen extends StatefulWidget {
  final String deviceId;
  const LoginScreen({super.key, required this.deviceId});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _codeController = TextEditingController();
  final _userController = TextEditingController();
  final _passController = TextEditingController();

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

    _codeFocusNode.unfocus();
    _userFocusNode.unfocus();
    _passFocusNode.unfocus();
    FocusScope.of(context).requestFocus(_loginFocusNode);

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
      if (!mounted) {
        return;
      }

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
        if (!mounted) {
          return;
        }

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
    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: true,
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
                    const Color(0xFF6A00FF).withValues(alpha: 0.22),
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
                    const Color(0xFF00D8C9).withValues(alpha: 0.16),
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
                final isCompactHeight = constraints.maxHeight < 430;
                final useHorizontalLayout = constraints.maxWidth >= 640;
                final contentWidth = availableWidth < 560
                    ? availableWidth
                    : availableWidth.clamp(560.0, 820.0).toDouble();

                return Center(
                  child: SingleChildScrollView(
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.manual,
                    padding: const EdgeInsets.symmetric(
                      vertical: 4,
                      horizontal: 8,
                    ),
                    child: Container(
                      width: contentWidth,
                      padding: EdgeInsets.all(isCompactHeight ? 14 : 18),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0C0C10),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: Colors.white10),
                      ),
                      child: useHorizontalLayout
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: isCompactHeight ? 190 : 220,
                                  child: _buildBrandPanel(isCompactHeight),
                                ),
                                SizedBox(width: isCompactHeight ? 16 : 22),
                                Expanded(
                                  child: _buildLoginPanel(
                                    context,
                                    compact: isCompactHeight,
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _buildBrandPanel(isCompactHeight),
                                SizedBox(height: isCompactHeight ? 12 : 16),
                                _buildLoginPanel(
                                  context,
                                  compact: isCompactHeight,
                                ),
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

  Widget _buildBrandPanel(bool compact) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: compact ? 88 : 112,
          height: compact ? 54 : 66,
          child: Image.asset(
            'assets/images/orio_logo.png',
            fit: BoxFit.contain,
            alignment: Alignment.centerLeft,
          ),
        ),
        SizedBox(height: compact ? 10 : 14),
        Container(
          width: double.infinity,
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 14,
            vertical: compact ? 9 : 11,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFF14141A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: const Color(0xFF6A00FF).withValues(alpha: 0.28),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Device ID',
                style: TextStyle(color: Colors.white54, fontSize: 10),
              ),
              const SizedBox(height: 4),
              Text(
                widget.deviceId,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: compact ? 12 : 13,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoginPanel(BuildContext context, {required bool compact}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Entrar',
          style: TextStyle(
            color: Colors.white,
            fontSize: compact ? 22 : 26,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.start,
        ),
        SizedBox(height: compact ? 10 : 12),
        if (_errorMessage != null) ...[
          Container(
            padding: EdgeInsets.all(compact ? 10 : 12),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _errorMessage!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.redAccent, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ),
          SizedBox(height: compact ? 8 : 10),
        ],
        _buildNativeInputField(
          label: 'Codigo',
          icon: Icons.confirmation_number_outlined,
          controller: _codeController,
          focusNode: _codeFocusNode,
          nextFocusNode: _userFocusNode,
          compact: compact,
        ),
        SizedBox(height: compact ? 7 : 9),
        _buildNativeInputField(
          label: 'Usuario',
          icon: Icons.person_outline,
          controller: _userController,
          focusNode: _userFocusNode,
          nextFocusNode: _passFocusNode,
          compact: compact,
        ),
        SizedBox(height: compact ? 7 : 9),
        _buildNativeInputField(
          label: 'Senha',
          icon: Icons.lock_outline,
          controller: _passController,
          focusNode: _passFocusNode,
          nextFocusNode: _loginFocusNode,
          obscure: true,
          compact: compact,
        ),
        SizedBox(height: compact ? 10 : 12),
        TvFocusable(
          focusNode: _loginFocusNode,
          onPressed: _isLoading ? null : _handleLogin,
          builder: (context, focused) => AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            padding: EdgeInsets.symmetric(vertical: compact ? 12 : 14),
            decoration: tvFocusDecoration(
              focused: focused,
              baseColor: focused ? Colors.white : const Color(0xFF6A00FF),
              radius: 14,
              focusedColor: const Color(0xFFB47CFF),
            ),
            child: Center(
              child: _isLoading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: focused ? const Color(0xFF6A00FF) : Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      'ENTRAR',
                      style: TextStyle(
                        color: focused ? const Color(0xFF6A00FF) : Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: compact ? 14 : 15,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNativeInputField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required FocusNode focusNode,
    FocusNode? nextFocusNode,
    bool obscure = false,
    bool compact = false,
  }) {
    return SizedBox(
      height: compact ? 44 : 50,
      child: TextField(
        focusNode: focusNode,
        controller: controller,
        obscureText: obscure,
        textInputAction: nextFocusNode == _loginFocusNode
            ? TextInputAction.done
            : TextInputAction.next,
        style: TextStyle(color: Colors.white, fontSize: compact ? 14 : 15),
        cursorColor: const Color(0xFFB47CFF),
        decoration: InputDecoration(
          hintText: label,
          hintStyle: const TextStyle(color: Colors.white54),
          filled: true,
          fillColor: const Color(0xFF14141A),
          prefixIcon: Icon(
            icon,
            color: const Color(0xFFB47CFF),
            size: compact ? 18 : 20,
          ),
          contentPadding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 14,
            vertical: compact ? 11 : 14,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Colors.white10),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFB47CFF), width: 2),
          ),
        ),
        onSubmitted: (_) {
          if (nextFocusNode == _loginFocusNode) {
            FocusScope.of(context).requestFocus(_loginFocusNode);
            _handleLogin();
            return;
          }
          if (nextFocusNode != null) {
            FocusScope.of(context).requestFocus(nextFocusNode);
            return;
          }
          _handleLogin();
        },
      ),
    );
  }
}
