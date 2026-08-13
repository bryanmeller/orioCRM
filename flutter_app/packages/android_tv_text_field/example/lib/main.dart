import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:native_textfield_tv/native_textfield_tv.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _platformVersion = 'Unknown';
  String _textContent = '';

  final FocusNode _firstTextFieldFocus = FocusNode();
  final FocusNode _secondTextFieldFocus = FocusNode();
  final FocusNode _thirdTextFieldFocus = FocusNode();

  // 使用同一个 controller 管理多个文本框，并设置初始文本
  final NativeTextFieldController _sharedController =
      NativeTextFieldController(text: '共享初始文本');

  // 独立的 controller
  final NativeTextFieldController _independentController =
      NativeTextFieldController(text: '独立初始文本');

  @override
  void initState() {
    super.initState();
    initPlatformState();
  }

  Future<void> initPlatformState() async {
    String platformVersion;
    try {
      platformVersion = await NativeTextfieldTv().getPlatformVersion() ??
          'Unknown platform version';
    } on PlatformException {
      platformVersion = 'Failed to get platform version.';
    }

    if (!mounted) return;

    setState(() {
      _platformVersion = platformVersion;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Native TextField TV Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: Scaffold(
        resizeToAvoidBottomInset: false,
        appBar: AppBar(
          title: const Text('Native TextField TV Demo'),
          backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Platform Info',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text('Platform Version: $_platformVersion'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Shared Controller Demo ',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          ElevatedButton.icon(
                            onPressed: () {
                              _sharedController.setText('Test Text');
                              setState(() {
                                _textContent = _sharedController.text;
                              });
                            },
                            icon: const Icon(Icons.edit),
                            label: const Text('Testing'),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
                            onPressed: () {
                              _sharedController.clear();
                              setState(() {
                                _textContent = _sharedController.text;
                              });
                            },
                            icon: const Icon(Icons.clear),
                            label: const Text('Testing 2'),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
                            onPressed: () {
                              _sharedController.setText('Testing Here');
                              setState(() {
                                _textContent = _sharedController.text;
                              });
                            },
                            icon: const Icon(Icons.sync),
                            label: const Text('This is For Testing'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text('TextField1:'),
                      AndroidTVTextField(
                        focusNode: _firstTextFieldFocus,
                        controller: _sharedController,
                      ),
                      const SizedBox(height: 16),
                      Text('TextField2:'),
                      AndroidTVTextField(
                        focusNode: _secondTextFieldFocus,
                        controller: _sharedController,
                      ),
                      const SizedBox(height: 16),
                      Text('TextField3:'),
                      AndroidTVTextField(
                        focusNode: _thirdTextFieldFocus,
                        controller: _independentController,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          ElevatedButton.icon(
                            onPressed: () {
                              _firstTextFieldFocus.requestFocus();
                            },
                            icon: const Icon(Icons.keyboard),
                            label: const Text('Testing'),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
                            onPressed: () {
                              _secondTextFieldFocus.requestFocus();
                            },
                            icon: const Icon(Icons.keyboard),
                            label: const Text('Testing'),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
                            onPressed: () {
                              _thirdTextFieldFocus.requestFocus();
                            },
                            icon: const Icon(Icons.keyboard),
                            label: const Text('Testing'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstTextFieldFocus.dispose();
    _secondTextFieldFocus.dispose();
    _thirdTextFieldFocus.dispose();
    _sharedController.dispose();
    _independentController.dispose();
    super.dispose();
  }
}
