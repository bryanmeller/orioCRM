import { FileNode } from '../types/flutter';

export const FLUTTER_PROJECT_TREE: FileNode[] = [
  {
    id: 'supabase_config.dart',
    name: 'supabase_config.dart',
    path: 'lib/core/supabase_config.dart',
    type: 'file',
    language: 'dart',
    description: 'Configuração das chaves do Supabase',
    content: `class SupabaseConfig {
  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://your-project.supabase.co');
  static const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'your-anon-key');
}
`
  },
  {
    id: 'supabase_provider.dart',
    name: 'supabase_provider.dart',
    path: 'lib/providers/supabase_provider.dart',
    type: 'file',
    language: 'dart',
    description: 'Provedor de Acesso ao Supabase',
    content: `import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_config.dart';

class SupabaseProvider {
  static final SupabaseProvider _instance = SupabaseProvider._internal();
  factory SupabaseProvider() => _instance;
  SupabaseProvider._internal();

  SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: SupabaseConfig.supabaseUrl,
      anonKey: SupabaseConfig.supabaseAnonKey,
    );
  }
}
`
  },

  {
    id: 'pubspec.yaml',
    name: 'pubspec.yaml',
    path: 'pubspec.yaml',
    type: 'file',
    language: 'yaml',
    description: 'Configuração de dependências do Flutter para Android TV & Fire TV',
    content: `name: streamflix_tv
description: "Aplicativo de Streaming para Android TV e Fire TV em Flutter - Módulo 2 Login Local e SharedPreferences"
publish_to: 'none'
version: 1.0.0+2

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # Navegação e Estado
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  
  # UI & Material 3 TV Support
  google_fonts: ^6.1.0
  flutter_animate: ^4.5.0
  
  # Armazenamento e Conectividade
  shared_preferences: ^2.2.2
  dio: ^5.4.0
  supabase_flutter: ^2.5.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
`
  },
  {
    id: 'android-manifest',
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    type: 'file',
    language: 'xml',
    description: 'Manifesto configurado com suporte Leanback para Android TV / Fire TV',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Declaração de Suporte para Android TV (Leanback) -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />

    <!-- Permissões Básicas -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="StreamFlix TV"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:banner="@drawable/tv_banner"
        android:logo="@drawable/tv_banner"
        android:theme="@style/LaunchTheme"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:taskAffinity=""
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <!-- Categoria Essencial para aparecer na launcher da Android TV / Fire TV -->
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`
  },
  {
    id: 'lib',
    name: 'lib',
    path: 'lib',
    type: 'folder',
    children: [
      {
        id: 'main.dart',
        name: 'main.dart',
        path: 'lib/main.dart',
        type: 'file',
        language: 'dart',
        description: 'Ponto de entrada do aplicativo Flutter com inicialização de serviços',
        content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Configuração para Android TV e Fire TV: Ocultar barras do sistema e manter fullscreen
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  // Travar orientação na horizontal (Landscape) recomendada para Smart TVs
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Inicializar Serviços Base
  final storageService = StorageService();
  await storageService.init();

  runApp(const StreamFlixApp());
}
`
      },
      {
        id: 'app.dart',
        name: 'app.dart',
        path: 'lib/app.dart',
        type: 'file',
        language: 'dart',
        description: 'Widget raiz configurando MaterialApp e rotas com atalhos D-Pad',
        content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'config/routes.dart';
import 'config/theme.dart';
import 'utils/tv_key_events.dart';

class StreamFlixApp extends StatelessWidget {
  const StreamFlixApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: <LogicalKeySet, Intent>{
        LogicalKeySet(LogicalKeyboardKey.select): const ActivateIntent(),
        LogicalKeySet(LogicalKeyboardKey.enter): const ActivateIntent(),
        LogicalKeySet(LogicalKeyboardKey.gameButtonA): const ActivateIntent(),
      },
      child: MaterialApp(
        title: 'StreamFlix TV',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        initialRoute: AppRoutes.splash,
        routes: AppRoutes.getRoutes(),
        builder: (context, child) {
          return TVKeyEventWrapper(
            child: child ?? const SizedBox.shrink(),
          );
        },
      ),
    );
  }
}
`
      },
      {
        id: 'config',
        name: 'config',
        path: 'lib/config',
        type: 'folder',
        children: [
          {
            id: 'constants.dart',
            name: 'constants.dart',
            path: 'lib/config/constants.dart',
            type: 'file',
            language: 'dart',
            description: 'Constantes globais da aplicação',
            content: `class AppConstants {
  static const String appName = 'StreamFlix TV';
  static const String appVersion = '1.0.0 (Módulo 2 - Login Local)';
  
  // Configurações de API (Mock/Placeholder para Módulo 1)
  static const String baseUrl = 'https://api.streamflix.tv/v1';
  static const int connectTimeoutMs = 10000;
  static const int receiveTimeoutMs = 15000;

  // Animações TV Focus
  static const Duration focusAnimationDuration = Duration(milliseconds: 200);
  static const double tvCardFocusScale = 1.08;
}
`
          },
          {
            id: 'routes.dart',
            name: 'routes.dart',
            path: 'lib/config/routes.dart',
            type: 'file',
            language: 'dart',
            description: 'Mapeamento centralizado de rotas da aplicação',
            content: `import 'package:flutter/material.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/login/login_screen.dart';
import '../screens/home/home_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String home = '/home';

  static Map<String, WidgetBuilder> getRoutes() {
    return {
      splash: (context) => const SplashScreen(),
      login: (context) => const LoginScreen(),
      home: (context) => const HomeScreen(),
    };
  }
}
`
          },
          {
            id: 'theme.dart',
            name: 'theme.dart',
            path: 'lib/config/theme.dart',
            type: 'file',
            language: 'dart',
            description: 'Configuração do Tema Material 3 com foco especial em Smart TV',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.card,
        background: AppColors.background,
        onPrimary: AppColors.textPrimary,
        onSecondary: AppColors.textPrimary,
        onSurface: AppColors.textPrimary,
      ),
      cardTheme: const CardThemeData(
        color: AppColors.card,
        elevation: 4,
        margin: EdgeInsets.all(8),
      ),
      focusColor: AppColors.focusGlow,
      highlightColor: AppColors.secondary,
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 32),
        titleLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 22),
        bodyLarge: TextStyle(color: AppColors.textPrimary, fontSize: 16),
        bodyMedium: TextStyle(color: AppColors.textSecondary, fontSize: 14),
      ),
    );
  }
}
`
          }
        ]
      },
      {
        id: 'theme',
        name: 'theme',
        path: 'lib/theme',
        type: 'folder',
        children: [
          {
            id: 'app_colors.dart',
            name: 'app_colors.dart',
            path: 'lib/theme/app_colors.dart',
            type: 'file',
            language: 'dart',
            description: 'Definição oficial das cores do projeto (Tema Dark TV)',
            content: `import 'package:flutter/material.dart';

/// Paleta de Cores Módulo 1 - StreamFlix TV
class AppColors {
  /// Cor principal (#6A00FF)
  static const Color primary = Color(0xFF6A00FF);

  /// Cor secundária (#9C4DFF)
  static const Color secondary = Color(0xFF9C4DFF);

  /// Background principal TV (#121212)
  static const Color background = Color(0xFF121212);

  /// Cards e contêineres (#1E1E1E)
  static const Color card = Color(0xFF1E1E1E);

  /// Borda de foco D-Pad ativo
  static const Color focusGlow = Color(0xFF9C4DFF);

  /// Cores de texto
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xB3FFFFFF); // 70% opacidade
  static const Color textMuted = Color(0x66FFFFFF); // 40% opacidade

  /// Indicadores de status
  static const Color success = Color(0xFF00E676);
  static const Color error = Color(0xFFFF5252);
  static const Color warning = Color(0xFFFFAB00);
}
`
          }
        ]
      },
      {
        id: 'models',
        name: 'models',
        path: 'lib/models',
        type: 'folder',
        children: [
          {
            id: 'user.dart',
            name: 'user.dart',
            path: 'lib/models/user.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo de Usuário para autenticação',
            content: `class User {
  final string id;
  final String username;
  final String email;
  final String? profileImageUrl;
  final bool isVip;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.profileImageUrl,
    this.isVip = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      isVip: json['isVip'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'profileImageUrl': profileImageUrl,
      'isVip': isVip,
    };
  }
}
`
          },
          {
            id: 'channel.dart',
            name: 'channel.dart',
            path: 'lib/models/channel.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo inicial Stub/Placeholder para futuras expansões de canais e M3U',
            content: `/// Modelo Stub de Canal/Conteúdo (Estrutura Módulo 1)
class Channel {
  final String id;
  final String name;
  final String category;
  final String? logoUrl;
  final String? streamUrl;
  final bool isFavorite;

  Channel({
    required this.id,
    required this.name,
    required this.category,
    this.logoUrl,
    this.streamUrl,
    this.isFavorite = false,
  });

  factory Channel.fromJson(Map<String, dynamic> json) {
    return Channel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      logoUrl: json['logoUrl'] as String?,
      streamUrl: json['streamUrl'] as String?,
      isFavorite: json['isFavorite'] as bool? ?? false,
    );
  }
}
`
          },
          {
            id: 'user_model.dart',
            name: 'user_model.dart',
            path: 'lib/models/user_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 4 representando os dados do Usuário retornado pelo servidor',
            content: `/// Modelo Módulo 4 de dados do Usuário retornado pela autenticação no servidor
class UserModel {
  final String nome;
  final String usuario;
  final String status;
  final String expiracao;
  final String perfil;

  UserModel({
    required this.nome,
    required this.usuario,
    required this.status,
    required this.expiracao,
    required this.perfil,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      nome: json['nome'] as String? ?? 'Usuário Streaming',
      usuario: json['usuario'] as String? ?? '',
      status: json['status'] as String? ?? 'Ativo',
      expiracao: json['expiracao'] as String? ?? '31/12/2026',
      perfil: json['perfil'] as String? ?? 'Assinante VIP',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nome': nome,
      'usuario': usuario,
      'status': status,
      'expiracao': expiracao,
      'perfil': perfil,
    };
  }
}
`
          },
          {
            id: 'auth_response_model.dart',
            name: 'auth_response_model.dart',
            path: 'lib/models/auth_response_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 4 de resposta da autenticação no servidor',
            content: `import 'user_model.dart';

/// Modelo Módulo 4 de resposta do servidor no fluxo de autenticação do usuário
class AuthResponseModel {
  final bool sucesso;
  final String? mensagem;
  final UserModel? usuario;

  AuthResponseModel({
    required this.sucesso,
    this.mensagem,
    this.usuario,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      sucesso: json['sucesso'] as bool? ?? false,
      mensagem: json['mensagem'] as String?,
      usuario: json['usuario'] != null
          ? UserModel.fromJson(json['usuario'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sucesso': sucesso,
      'mensagem': mensagem,
      'usuario': usuario?.toJson(),
    };
  }
}
`
          },
          {
            id: 'server_model.dart',
            name: 'server_model.dart',
            path: 'lib/models/server_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 3 representando a configuração do servidor retornado pela API Central',
            content: `/// Modelo Módulo 3 representando a configuração do servidor retornado pela API Central
class ServerModel {
  final String code;
  final String name;
  final String url;
  final String status;
  final String? logo;

  ServerModel({
    required this.code,
    required this.name,
    required this.url,
    required this.status,
    this.logo,
  });

  factory ServerModel.fromJson(Map<String, dynamic> json) {
    return ServerModel(
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      url: json['url'] as String? ?? '',
      status: json['status'] as String? ?? 'inactive',
      logo: json['logo'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
      'url': url,
      'status': status,
      'logo': logo,
    };
  }
}
`
          },
          {
            id: 'provider_theme_model.dart',
            name: 'provider_theme_model.dart',
            path: 'lib/models/provider_theme_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 9 - Personalização Dinâmica por Servidor (Identidade Visual Multi-Tenant com Cores e Logotipos)',
            content: `import 'package:flutter/material.dart';

/// Modelo Módulo 9 - Personalização Dinâmica por Servidor (Identidade Visual Multi-Tenant)
class ProviderThemeModel {
  final String licenseCode;
  final String providerName;
  final String logoUrl;
  final String bannerUrl;
  final String primaryColorHex;
  final String secondaryColorHex;
  final String backgroundImageUrl;
  final String welcomeMessage;

  ProviderThemeModel({
    required this.licenseCode,
    required this.providerName,
    required this.logoUrl,
    required this.bannerUrl,
    required this.primaryColorHex,
    required this.secondaryColorHex,
    required this.backgroundImageUrl,
    required this.welcomeMessage,
  });

  /// Converte Hex String "#6A00FF" em Color Flutter
  Color get primaryColor => _parseHexColor(primaryColorHex, const Color(0xFF6A00FF));
  Color get secondaryColor => _parseHexColor(secondaryColorHex, const Color(0xFF9C4DFF));

  static Color _parseHexColor(String hexString, Color defaultColor) {
    try {
      final buffer = StringBuffer();
      if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
      buffer.write(hexString.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return defaultColor;
    }
  }

  factory ProviderThemeModel.fromJson(Map<String, dynamic> json) {
    final serverJson = json['server'] ?? json;
    final themeJson = serverJson['theme'] ?? {};

    return ProviderThemeModel(
      licenseCode: serverJson['code']?.toString() ?? '100',
      providerName: serverJson['name'] as String? ?? 'StreamFlix TV',
      logoUrl: serverJson['logo'] as String? ?? '',
      bannerUrl: serverJson['banner'] as String? ?? '',
      primaryColorHex: themeJson['primary'] as String? ?? '#6A00FF',
      secondaryColorHex: themeJson['secondary'] as String? ?? '#9C4DFF',
      backgroundImageUrl: serverJson['bg_image'] as String? ?? '',
      welcomeMessage: serverJson['welcome'] as String? ?? 'Bem-vindo ao Servidor',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'server': {
        'code': licenseCode,
        'name': providerName,
        'logo': logoUrl,
        'banner': bannerUrl,
        'bg_image': backgroundImageUrl,
        'welcome': welcomeMessage,
        'theme': {
          'primary': primaryColorHex,
          'secondary': secondaryColorHex,
        }
      }
    };
  }

  static ProviderThemeModel defaultTheme() {
    return ProviderThemeModel(
      licenseCode: '100',
      providerName: 'StreamFlix Premium',
      logoUrl: '',
      bannerUrl: '',
      primaryColorHex: '#6A00FF',
      secondaryColorHex: '#9C4DFF',
      backgroundImageUrl: '',
      welcomeMessage: 'Seja bem-vindo ao StreamFlix',
    );
  }
}
`
          },
          {
            id: 'license_model.dart',
            name: 'license_model.dart',
            path: 'lib/models/license_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 11 - Representação da Licença UUID (Status ATIVA, EXPIRADA, BLOQUEADA)',
            content: `/// Enum de Status de Licença Módulo 11
enum LicenseStatus { ativa, expirada, bloqueada }

/// Modelo Módulo 11 representando a licença UUID associada ao usuário final
class LicenseModel {
  final String id;
  final String uuid;
  final String userId;
  final String providerId;
  final String? resellerId;
  final LicenseStatus status;
  final String expiresAt;
  final String createdAt;

  LicenseModel({
    required this.id,
    required this.uuid,
    required this.userId,
    required this.providerId,
    this.resellerId,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
  });

  bool get isAtiva => status == LicenseStatus.ativa;
  bool get isExpirada => status == LicenseStatus.expirada;
  bool get isBloqueada => status == LicenseStatus.bloqueada;

  factory LicenseModel.fromJson(Map<String, dynamic> json) {
    LicenseStatus parseStatus(String? st) {
      switch (st?.toUpperCase()) {
        case 'EXPIRADA':
          return LicenseStatus.expirada;
        case 'BLOQUEADA':
          return LicenseStatus.bloqueada;
        case 'ATIVA':
        default:
          return LicenseStatus.ativa;
      }
    }

    return LicenseModel(
      id: json['id'] as String? ?? '',
      uuid: json['uuid'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      providerId: json['provider_id'] as String? ?? '',
      resellerId: json['reseller_id'] as String?,
      status: parseStatus(json['status'] as String?),
      expiresAt: json['expires_at'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}
`
          },
          {
            id: 'channel_model.dart',
            name: 'channel_model.dart',
            path: 'lib/models/channel_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 6 de Canal de TV com id, nome, logo, categoria, descrição e favorito',
            content: `/// Modelo Módulo 6 de Canal de TV preparado para API futura
class ChannelModel {
  final String id;
  final String nome;
  final String logo;
  final String categoria;
  final String descricao;
  final bool favorito;

  ChannelModel({
    required this.id,
    required this.nome,
    required this.logo,
    required this.categoria,
    required this.descricao,
    this.favorito = false,
  });

  factory ChannelModel.fromJson(Map<String, dynamic> json) {
    return ChannelModel(
      id: json['id'] as String,
      nome: json['nome'] as String,
      logo: json['logo'] as String? ?? '',
      categoria: json['categoria'] as String,
      descricao: json['descricao'] as String? ?? '',
      favorito: json['favorito'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'logo': logo,
      'categoria': categoria,
      'descricao': descricao,
      'favorito': favorito,
    };
  }

  ChannelModel copyWith({
    String? id,
    String? nome,
    String? logo,
    String? categoria,
    String? descricao,
    bool? favorito,
  }) {
    return ChannelModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      logo: logo ?? this.logo,
      categoria: categoria ?? this.categoria,
      descricao: descricao ?? this.descricao,
      favorito: favorito ?? this.favorito,
    );
  }
}
`
          },
          {
            id: 'movie_model.dart',
            name: 'movie_model.dart',
            path: 'lib/models/movie_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 6 de Filme com título, capa, banner, descrição, ano, categoria, duração e favorito',
            content: `/// Modelo Módulo 6 de Filme para o catálogo VOD
class MovieModel {
  final String id;
  final String titulo;
  final String capa;
  final String banner;
  final String descricao;
  final String ano;
  final String categoria;
  final String duracao;
  final bool favorito;

  MovieModel({
    required this.id,
    required this.titulo,
    required this.capa,
    required this.banner,
    required this.descricao,
    required this.ano,
    required this.categoria,
    required this.duracao,
    this.favorito = false,
  });

  factory MovieModel.fromJson(Map<String, dynamic> json) {
    return MovieModel(
      id: json['id'] as String,
      titulo: json['titulo'] as String,
      capa: json['capa'] as String,
      banner: json['banner'] as String? ?? json['capa'] as String,
      descricao: json['descricao'] as String,
      ano: json['ano'] as String,
      categoria: json['categoria'] as String,
      duracao: json['duracao'] as String,
      favorito: json['favorito'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'titulo': titulo,
      'capa': capa,
      'banner': banner,
      'descricao': descricao,
      'ano': ano,
      'categoria': categoria,
      'duracao': duracao,
      'favorito': favorito,
    };
  }

  MovieModel copyWith({
    String? id,
    String? titulo,
    String? capa,
    String? banner,
    String? descricao,
    String? ano,
    String? categoria,
    String? duracao,
    bool? favorito,
  }) {
    return MovieModel(
      id: id ?? this.id,
      titulo: titulo ?? this.titulo,
      capa: capa ?? this.capa,
      banner: banner ?? this.banner,
      descricao: descricao ?? this.descricao,
      ano: ano ?? this.ano,
      categoria: categoria ?? this.categoria,
      duracao: duracao ?? this.duracao,
      favorito: favorito ?? this.favorito,
    );
  }
}
`
          },
          {
            id: 'episode_model.dart',
            name: 'episode_model.dart',
            path: 'lib/models/episode_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 6 de Episódio para a estrutura de séries',
            content: `/// Modelo Módulo 6 de Episódio
class EpisodeModel {
  final String id;
  final int numero;
  final String titulo;
  final String duracao;
  final String descricao;

  EpisodeModel({
    required this.id,
    required this.numero,
    required this.titulo,
    required this.duracao,
    required this.descricao,
  });

  factory EpisodeModel.fromJson(Map<String, dynamic> json) {
    return EpisodeModel(
      id: json['id'] as String,
      numero: json['numero'] as int,
      titulo: json['titulo'] as String,
      duracao: json['duracao'] as String,
      descricao: json['descricao'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'numero': numero,
      'titulo': titulo,
      'duracao': duracao,
      'descricao': descricao,
    };
  }
}
`
          },
          {
            id: 'series_model.dart',
            name: 'series_model.dart',
            path: 'lib/models/series_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 6 de Série com título, capa, banner, descrição, categorias, temporadas, episódios e favorito',
            content: `import 'episode_model.dart';

/// Modelo Módulo 6 de Série de TV
class SeriesModel {
  final String id;
  final String titulo;
  final String capa;
  final String banner;
  final String descricao;
  final List<String> categorias;
  final int temporadas;
  final List<EpisodeModel> episodios;
  final bool favorito;

  SeriesModel({
    required this.id,
    required this.titulo,
    required this.capa,
    required this.banner,
    required this.descricao,
    required this.categorias,
    required this.temporadas,
    required this.episodios,
    this.favorito = false,
  });

  factory SeriesModel.fromJson(Map<String, dynamic> json) {
    return SeriesModel(
      id: json['id'] as String,
      titulo: json['titulo'] as String,
      capa: json['capa'] as String,
      banner: json['banner'] as String? ?? json['capa'] as String,
      descricao: json['descricao'] as String,
      categorias: List<String>.from(json['categorias'] as List? ?? []),
      temporadas: json['temporadas'] as int? ?? 1,
      episodios: (json['episodios'] as List? ?? [])
          .map((e) => EpisodeModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      favorito: json['favorito'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'titulo': titulo,
      'capa': capa,
      'banner': banner,
      'descricao': descricao,
      'categorias': categorias,
      'temporadas': temporadas,
      'episodios': episodios.map((e) => e.toJson()).toList(),
      'favorito': favorito,
    };
  }

  SeriesModel copyWith({
    String? id,
    String? titulo,
    String? capa,
    String? banner,
    String? descricao,
    List<String>? categorias,
    int? temporadas,
    List<EpisodeModel>? episodios,
    bool? favorito,
  }) {
    return SeriesModel(
      id: id ?? this.id,
      titulo: titulo ?? this.titulo,
      capa: capa ?? this.capa,
      banner: banner ?? this.banner,
      descricao: descricao ?? this.descricao,
      categorias: categorias ?? this.categorias,
      temporadas: temporadas ?? this.temporadas,
      episodios: episodios ?? this.episodios,
      favorito: favorito ?? this.favorito,
    );
  }
}
`
          },
          {
            id: 'api_response_model.dart',
            name: 'api_response_model.dart',
            path: 'lib/models/api_response_model.dart',
            type: 'file',
            language: 'dart',
            description: 'Modelo Módulo 3 de resposta padronizada da API Central de Servidores',
            content: `import 'server_model.dart';

/// Modelo Módulo 3 de resposta padronizada da API Central de Servidores
class ApiResponseModel {
  final bool success;
  final String? message;
  final ServerModel? server;

  ApiResponseModel({
    required this.success,
    this.message,
    this.server,
  });

  factory ApiResponseModel.fromJson(Map<String, dynamic> json) {
    return ApiResponseModel(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
      server: json['server'] != null
          ? ServerModel.fromJson(json['server'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'server': server?.toJson(),
    };
  }
}
`
          }
        ]
      },
      {
        id: 'services',
        name: 'services',
        path: 'lib/services',
        type: 'folder',
        children: [
          {
            id: 'api_service.dart',
            name: 'api_service.dart',
            path: 'lib/services/api_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço HTTP de comunicação com retentativas e tratamento de exceções',
            content: `import 'dart:async';

class ApiService {
  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    // Simulação de chamada HTTP rápida para a estrutura inicial
    await Future.delayed(const Duration(milliseconds: 600));
    if (endpoint == '/login') {
      if (body['username'] == 'admin' && body['password'] == '1234') {
        return {
          'success': true,
          'token': 'jwt_mock_token_streamflix_tv_123',
          'user': {
            'id': 'usr_001',
            'username': 'Administrador TV',
            'email': 'admin@streamflix.tv',
            'isVip': true
          }
        };
      } else {
        return {
          'success': false,
          'message': 'Credenciais inválidas. Tente admin / 1234'
        };
      }
    }
    return {'success': true};
  }
}
`
          },
          {
            id: 'auth_service.dart',
            name: 'auth_service.dart',
            path: 'lib/services/auth_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 4 responsável por autenticar Usuário e Senha no Servidor retornado pela API Central',
            content: `import 'dart:async';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';
import '../models/server_model.dart';

/// Serviço Módulo 4 de Autenticação desvinculado da interface de usuário.
/// Realiza a chamada REST ao servidor retornado pela API Central.
class AuthService {
  /// Autentica o usuário e senha no servidor especificado
  Future<AuthResponseModel> authenticateUser({
    required ServerModel server,
    required String username,
    required String password,
  }) async {
    final cleanUsername = username.trim();
    final cleanPassword = password.trim();

    if (cleanUsername.isEmpty || cleanPassword.isEmpty) {
      return AuthResponseModel(
        sucesso: false,
        mensagem: 'Usuário e senha são obrigatórios.',
      );
    }

    try {
      // Simulação da requisição HTTP ao servidor resolvido (server.url)
      await Future.delayed(const Duration(milliseconds: 1200));

      // Tratamento de cenários de erro e sucesso do servidor
      if (cleanUsername == 'erro' || cleanUsername == 'offline') {
        return AuthResponseModel(
          sucesso: false,
          mensagem: 'Não foi possível conectar ao servidor.',
        );
      }

      if ((cleanUsername == 'usuario123' && cleanPassword == '123456') ||
          (cleanUsername == 'admin' && cleanPassword == '123456') ||
          cleanUsername.startsWith('user')) {
        return AuthResponseModel(
          sucesso: true,
          usuario: UserModel(
            nome: cleanUsername == 'admin' ? 'Administrador do Sistema' : 'Carlos Silva',
            usuario: cleanUsername,
            status: 'Ativo',
            expiracao: '31/12/2026',
            perfil: 'Assinante VIP 4K',
          ),
        );
      } else {
        return AuthResponseModel(
          sucesso: false,
          mensagem: 'Usuário ou senha inválidos.',
        );
      }
    } catch (e) {
      return AuthResponseModel(
        sucesso: false,
        mensagem: 'Não foi possível conectar ao servidor.',
      );
    }
  }
}
`
          },
          {
            id: 'server_service.dart',
            name: 'server_service.dart',
            path: 'lib/services/server_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 3 de consulta HTTP à API Central de Servidores GET https://api.meuapp.com/server/{codigo}',
            content: `import 'dart:async';
import '../models/api_response_model.dart';
import '../models/server_model.dart';

/// Serviço Módulo 3 responsável pela comunicação com a API Central de Servidores.
/// O aplicativo realiza uma requisição GET https://api.meuapp.com/server/{codigo}
class ServerService {
  static const String baseUrl = 'https://api.meuapp.com/server';

  /// Consulta as informações do servidor na API Central a partir do código informado pelo usuário
  Future<ApiResponseModel> fetchServerByCode(String code) async {
    final cleanCode = code.trim();
    if (cleanCode.isEmpty) {
      return ApiResponseModel(
        success: false,
        message: 'Código da Licença é obrigatório.',
      );
    }

    try {
      // Simulação de requisição HTTP REST para a API Central com delay
      await Future.delayed(const Duration(milliseconds: 1500));

      // Respostas simuladas do banco de dados da API Central (Módulo 9 com Theme Payload)
      if (cleanCode == '100') {
        final mockJson = {};
        return ApiResponseModel.fromJson(mockJson);
      } else if (cleanCode == '200') {
        final mockJson = {};
        return ApiResponseModel.fromJson(mockJson);
      } else if (cleanCode == '300') {
        final mockJson = {};
        return ApiResponseModel.fromJson(mockJson);
      } else if (cleanCode == '999') {
        // Servidor inativo ou bloqueado
        final mockJson = {};
        return ApiResponseModel.fromJson(mockJson);
      } else {
        // Código de servidor não encontrado na API Central
        return ApiResponseModel(
          success: false,
          message: 'Servidor não encontrado.',
        );
      }
    } catch (e) {
      return ApiResponseModel(
        success: false,
        message: 'Falha na comunicação com a API Central.',
      );
    }
  }
}
`
          },
          {
            id: 'storage_service.dart',
            name: 'storage_service.dart',
            path: 'lib/services/storage_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 3 de persistência local de credenciais e dados do servidor retornado da API Central',
            content: `import 'package:shared_preferences/shared_preferences.dart';

/// Serviço Módulo 4 responsável pelo armazenamento local da sessão e dados do Usuário retornado pela autenticação.
class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  SharedPreferences? _prefs;

  static const String keyLicenseCode = 'server_code';
  static const String keyServerName = 'server_name';
  static const String keyServerUrl = 'server_url';
  static const String keyServerLogo = 'server_logo';
  static const String keyUsername = 'saved_username';
  static const String keyPassword = 'saved_password';
  static const String keyUserName = 'user_name';
  static const String keyUserStatus = 'user_status';
  static const String keyUserExpiracao = 'user_expiracao';
  static const String keyUserPerfil = 'user_perfil';
  static const String keyIsLoggedIn = 'is_logged_in';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Salva as configurações do servidor e credenciais do usuário
  Future<bool> saveServerConfigAndCredentials({
    required String licenseCode,
    required String serverName,
    required String serverUrl,
    String? serverLogo,
    required String username,
    required String password,
  }) async {
    await init();
    await _prefs?.setString(keyLicenseCode, licenseCode);
    await _prefs?.setString(keyServerName, serverName);
    await _prefs?.setString(keyServerUrl, serverUrl);
    if (serverLogo != null) {
      await _prefs?.setString(keyServerLogo, serverLogo);
    }
    await _prefs?.setString(keyUsername, username);
    await _prefs?.setString(keyPassword, password);
    return await _prefs?.setBool(keyIsLoggedIn, true) ?? false;
  }

  /// Salva os dados do UserModel obtidos do servidor após o login
  Future<void> saveUserSession(dynamic user) async {
    await init();
    await _prefs?.setString(keyUserName, user.nome);
    await _prefs?.setString(keyUserStatus, user.status);
    await _prefs?.setString(keyUserExpiracao, user.expiracao);
    await _prefs?.setString(keyUserPerfil, user.perfil);
  }

  /// Recupera credenciais e dados do servidor salvos para auto fill
  Map<String, String> getSavedCredentials() {
    return {
      'licenseCode': _prefs?.getString(keyLicenseCode) ?? '100',
      'serverName': _prefs?.getString(keyServerName) ?? 'Servidor Premium HD/4K',
      'serverUrl': _prefs?.getString(keyServerUrl) ?? 'https://servidor.com',
      'serverLogo': _prefs?.getString(keyServerLogo) ?? '',
      'username': _prefs?.getString(keyUsername) ?? 'usuario123',
      'password': _prefs?.getString(keyPassword) ?? '123456',
      'userName': _prefs?.getString(keyUserName) ?? 'Carlos Silva',
      'userStatus': _prefs?.getString(keyUserStatus) ?? 'Ativo',
      'userExpiracao': _prefs?.getString(keyUserExpiracao) ?? '31/12/2026',
    };
  }

  String getLicenseCode() => _prefs?.getString(keyLicenseCode) ?? '100';
  String getServerName() => _prefs?.getString(keyServerName) ?? 'Servidor Premium';
  String getServerUrl() => _prefs?.getString(keyServerUrl) ?? 'https://servidor.com';
  String getUsername() => _prefs?.getString(keyUsername) ?? 'usuario123';
  String getUserName() => _prefs?.getString(keyUserName) ?? 'Carlos Silva';
  String getUserStatus() => _prefs?.getString(keyUserStatus) ?? 'Ativo';
  String getUserExpiracao() => _prefs?.getString(keyUserExpiracao) ?? '31/12/2026';
  String getPassword() => _prefs?.getString(keyPassword) ?? '123456';

  bool isLoggedIn() => _prefs?.getBool(keyIsLoggedIn) ?? false;

  /// Ao fazer logout, encerra a sessão mas MANTÉM credenciais e servidor salvos para facilidade do usuário
  Future<void> logout() async {
    await init();
    await _prefs?.setBool(keyIsLoggedIn, false);
  }

  Future<bool> setString(String key, String value) async {
    await init();
    return await _prefs?.setString(key, value) ?? false;
  }

  String? getString(String key) {
    return _prefs?.getString(key);
  }

  Future<bool> remove(String key) async {
    await init();
    return await _prefs?.remove(key) ?? false;
  }
}
`
          },
          {
            id: 'content_api_service.dart',
            name: 'content_api_service.dart',
            path: 'lib/services/content_api_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 genérico para comunicação HTTP, requisições REST e conversão JSON com o servidor',
            content: `import 'dart:async';
import 'dart:convert';
import '../models/channel_model.dart';
import '../models/movie_model.dart';
import '../models/series_model.dart';
import '../models/episode_model.dart';

/// Serviço Módulo 7 - Camada genérica de comunicação de conteúdo via HTTP/REST
class ContentApiService {
  final String serverUrl;
  final String username;
  final String password;

  ContentApiService({
    required this.serverUrl,
    required this.username,
    required this.password,
  });

  /// Busca lista de canais de TV ao vivo no servidor configurado
  Future<List<ChannelModel>> fetchLiveChannels() async {
    // Simulação de requisição HTTP (http.get('\$serverUrl/api/live?user=\$username&pass=\$password'))
    await Future.delayed(const Duration(milliseconds: 600));

    // Exemplo de resposta JSON convertida
    final mockJson = [];

    return mockJson.map((json) => ChannelModel.fromJson(json)).toList();
  }

  /// Busca lista VOD de filmes no servidor
  Future<List<MovieModel>> fetchMovies() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => MovieModel.fromJson(json)).toList();
  }

  /// Busca lista VOD de séries no servidor
  Future<List<SeriesModel>> fetchSeries() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => SeriesModel.fromJson(json)).toList();
  }
}
`
          },
          {
            id: 'content_cache_service.dart',
            name: 'content_cache_service.dart',
            path: 'lib/services/content_cache_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 de Cache Local para guardar a última lista de conteúdos e abrir o app mais rápido',
            content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/channel_model.dart';
import '../models/movie_model.dart';
import '../models/series_model.dart';

/// Serviço Módulo 7 - Sistema de Cache Local simples via SharedPreferences
class ContentCacheService {
  static final ContentCacheService _instance = ContentCacheService._internal();
  factory ContentCacheService() => _instance;
  ContentCacheService._internal();

  SharedPreferences? _prefs;

  static const String keyChannelsCache = 'streamflix_cache_channels';
  static const String keyMoviesCache = 'streamflix_cache_movies';
  static const String keySeriesCache = 'streamflix_cache_series';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Salva a lista de canais em cache local JSON
  Future<bool> saveChannelsCache(List<ChannelModel> channels) async {
    await init();
    final jsonList = channels.map((c) => c.toJson()).toList();
    return await _prefs?.setString(keyChannelsCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera a lista de canais em cache local
  Future<List<ChannelModel>?> getChannelsCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyChannelsCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => ChannelModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva lista de filmes em cache local
  Future<bool> saveMoviesCache(List<MovieModel> movies) async {
    await init();
    final jsonList = movies.map((m) => m.toJson()).toList();
    return await _prefs?.setString(keyMoviesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera filmes em cache local
  Future<List<MovieModel>?> getMoviesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyMoviesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => MovieModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva séries em cache local
  Future<bool> saveSeriesCache(List<SeriesModel> series) async {
    await init();
    final jsonList = series.map((s) => s.toJson()).toList();
    return await _prefs?.setString(keySeriesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera séries em cache local
  Future<List<SeriesModel>?> getSeriesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keySeriesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => SeriesModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Limpa todo o cache local de conteúdos (acionado pelo botão 'Atualizar Conteúdo')
  Future<void> clearCache() async {
    await init();
    await _prefs?.remove(keyChannelsCache);
    await _prefs?.remove(keyMoviesCache);
    await _prefs?.remove(keySeriesCache);
  }
}
`
          },
          {
            id: 'channel_service.dart',
            name: 'channel_service.dart',
            path: 'lib/services/channel_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/channel_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 para fornecimento de canais de TV ao vivo com integração de servidor e cache
class ChannelService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<ChannelModel>> getChannels({required String licenseCode}) async {
    try {
      final response = await dio.get('/api/content/channels');
      final List<dynamic> data = response.data;
      return data.map((json) => ChannelModel.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching channels: $e');
      return [];
    }
  }

  /// Busca lista VOD de filmes no servidor
  Future<List<MovieModel>> fetchMovies() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => MovieModel.fromJson(json)).toList();
  }

  /// Busca lista VOD de séries no servidor
  Future<List<SeriesModel>> fetchSeries() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => SeriesModel.fromJson(json)).toList();
  }
}
`
          },
          {
            id: 'content_cache_service.dart',
            name: 'content_cache_service.dart',
            path: 'lib/services/content_cache_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 de Cache Local para guardar a última lista de conteúdos e abrir o app mais rápido',
            content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/channel_model.dart';
import '../models/movie_model.dart';
import '../models/series_model.dart';

/// Serviço Módulo 7 - Sistema de Cache Local simples via SharedPreferences
class ContentCacheService {
  static final ContentCacheService _instance = ContentCacheService._internal();
  factory ContentCacheService() => _instance;
  ContentCacheService._internal();

  SharedPreferences? _prefs;

  static const String keyChannelsCache = 'streamflix_cache_channels';
  static const String keyMoviesCache = 'streamflix_cache_movies';
  static const String keySeriesCache = 'streamflix_cache_series';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Salva a lista de canais em cache local JSON
  Future<bool> saveChannelsCache(List<ChannelModel> channels) async {
    await init();
    final jsonList = channels.map((c) => c.toJson()).toList();
    return await _prefs?.setString(keyChannelsCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera a lista de canais em cache local
  Future<List<ChannelModel>?> getChannelsCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyChannelsCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => ChannelModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva lista de filmes em cache local
  Future<bool> saveMoviesCache(List<MovieModel> movies) async {
    await init();
    final jsonList = movies.map((m) => m.toJson()).toList();
    return await _prefs?.setString(keyMoviesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera filmes em cache local
  Future<List<MovieModel>?> getMoviesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyMoviesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => MovieModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva séries em cache local
  Future<bool> saveSeriesCache(List<SeriesModel> series) async {
    await init();
    final jsonList = series.map((s) => s.toJson()).toList();
    return await _prefs?.setString(keySeriesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera séries em cache local
  Future<List<SeriesModel>?> getSeriesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keySeriesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => SeriesModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Limpa todo o cache local de conteúdos (acionado pelo botão 'Atualizar Conteúdo')
  Future<void> clearCache() async {
    await init();
    await _prefs?.remove(keyChannelsCache);
    await _prefs?.remove(keyMoviesCache);
    await _prefs?.remove(keySeriesCache);
  }
}
`
          },
          {
            id: 'channel_service.dart',
            name: 'channel_service.dart',
            path: 'lib/services/channel_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/channel_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 para fornecimento de canais de TV ao vivo com integração de servidor e cache
class ChannelService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<ChannelModel>> getChannels({
    required ContentApiService apiService,
    String? categoria,
    bool forceRefresh = false,
  }) async {
    // 1. Se não for atualização forçada, tenta carregar do cache local primeiro para agilidade
    if (!forceRefresh) {
      final cached = await _cacheService.getChannelsCache();
      if (cached != null && cached.isNotEmpty) {
        if (categoria == null || categoria == 'Todos' || categoria == 'todos') return cached;
        return cached.where((c) => c.categoria.toLowerCase() == categoria.toLowerCase()).toList();
      }
    }

    // 2. Busca do servidor real via ContentApiService
    final remoteChannels = await apiService.fetchLiveChannels();

    // 3. Salva no cache local
    await _cacheService.saveChannelsCache(remoteChannels);

    if (categoria == null || categoria == 'Todos' || categoria == 'todos') return remoteChannels;
    return remoteChannels.where((c) => c.categoria.toLowerCase() == categoria.toLowerCase()).toList();
  }
}
`
          },
          {
            id: 'movie_service.dart',
            name: 'movie_service.dart',
            path: 'lib/services/movie_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 para filmes integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/movie_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 para consulta do catálogo VOD de Filmes
class MovieService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<MovieModel>> getMovies({required String licenseCode}) async {
    try {
      final response = await dio.get('/api/content/movies');
      final List<dynamic> data = response.data;
      return data.map((json) => MovieModel.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching movies: $e');
      return [];
    }
  }

  /// Busca lista VOD de séries no servidor
  Future<List<SeriesModel>> fetchSeries() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => SeriesModel.fromJson(json)).toList();
  }
}
`
          },
          {
            id: 'content_cache_service.dart',
            name: 'content_cache_service.dart',
            path: 'lib/services/content_cache_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 de Cache Local para guardar a última lista de conteúdos e abrir o app mais rápido',
            content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/channel_model.dart';
import '../models/movie_model.dart';
import '../models/series_model.dart';

/// Serviço Módulo 7 - Sistema de Cache Local simples via SharedPreferences
class ContentCacheService {
  static final ContentCacheService _instance = ContentCacheService._internal();
  factory ContentCacheService() => _instance;
  ContentCacheService._internal();

  SharedPreferences? _prefs;

  static const String keyChannelsCache = 'streamflix_cache_channels';
  static const String keyMoviesCache = 'streamflix_cache_movies';
  static const String keySeriesCache = 'streamflix_cache_series';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Salva a lista de canais em cache local JSON
  Future<bool> saveChannelsCache(List<ChannelModel> channels) async {
    await init();
    final jsonList = channels.map((c) => c.toJson()).toList();
    return await _prefs?.setString(keyChannelsCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera a lista de canais em cache local
  Future<List<ChannelModel>?> getChannelsCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyChannelsCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => ChannelModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva lista de filmes em cache local
  Future<bool> saveMoviesCache(List<MovieModel> movies) async {
    await init();
    final jsonList = movies.map((m) => m.toJson()).toList();
    return await _prefs?.setString(keyMoviesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera filmes em cache local
  Future<List<MovieModel>?> getMoviesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyMoviesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => MovieModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva séries em cache local
  Future<bool> saveSeriesCache(List<SeriesModel> series) async {
    await init();
    final jsonList = series.map((s) => s.toJson()).toList();
    return await _prefs?.setString(keySeriesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera séries em cache local
  Future<List<SeriesModel>?> getSeriesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keySeriesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => SeriesModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Limpa todo o cache local de conteúdos (acionado pelo botão 'Atualizar Conteúdo')
  Future<void> clearCache() async {
    await init();
    await _prefs?.remove(keyChannelsCache);
    await _prefs?.remove(keyMoviesCache);
    await _prefs?.remove(keySeriesCache);
  }
}
`
          },
          {
            id: 'channel_service.dart',
            name: 'channel_service.dart',
            path: 'lib/services/channel_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/channel_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 para fornecimento de canais de TV ao vivo com integração de servidor e cache
class ChannelService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<ChannelModel>> getChannels({required String licenseCode}) async {
    try {
      final response = await dio.get('/api/content/channels');
      final List<dynamic> data = response.data;
      return data.map((json) => ChannelModel.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching channels: $e');
      return [];
    }
  }

  /// Busca lista VOD de filmes no servidor
  Future<List<MovieModel>> fetchMovies() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => MovieModel.fromJson(json)).toList();
  }

  /// Busca lista VOD de séries no servidor
  Future<List<SeriesModel>> fetchSeries() async {
    await Future.delayed(const Duration(milliseconds: 600));

    final mockJson = [];

    return mockJson.map((json) => SeriesModel.fromJson(json)).toList();
  }
}
`
          },
          {
            id: 'content_cache_service.dart',
            name: 'content_cache_service.dart',
            path: 'lib/services/content_cache_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 de Cache Local para guardar a última lista de conteúdos e abrir o app mais rápido',
            content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/channel_model.dart';
import '../models/movie_model.dart';
import '../models/series_model.dart';

/// Serviço Módulo 7 - Sistema de Cache Local simples via SharedPreferences
class ContentCacheService {
  static final ContentCacheService _instance = ContentCacheService._internal();
  factory ContentCacheService() => _instance;
  ContentCacheService._internal();

  SharedPreferences? _prefs;

  static const String keyChannelsCache = 'streamflix_cache_channels';
  static const String keyMoviesCache = 'streamflix_cache_movies';
  static const String keySeriesCache = 'streamflix_cache_series';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Salva a lista de canais em cache local JSON
  Future<bool> saveChannelsCache(List<ChannelModel> channels) async {
    await init();
    final jsonList = channels.map((c) => c.toJson()).toList();
    return await _prefs?.setString(keyChannelsCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera a lista de canais em cache local
  Future<List<ChannelModel>?> getChannelsCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyChannelsCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => ChannelModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva lista de filmes em cache local
  Future<bool> saveMoviesCache(List<MovieModel> movies) async {
    await init();
    final jsonList = movies.map((m) => m.toJson()).toList();
    return await _prefs?.setString(keyMoviesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera filmes em cache local
  Future<List<MovieModel>?> getMoviesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keyMoviesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => MovieModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Salva séries em cache local
  Future<bool> saveSeriesCache(List<SeriesModel> series) async {
    await init();
    final jsonList = series.map((s) => s.toJson()).toList();
    return await _prefs?.setString(keySeriesCache, jsonEncode(jsonList)) ?? false;
  }

  /// Recupera séries em cache local
  Future<List<SeriesModel>?> getSeriesCache() async {
    await init();
    final jsonStr = _prefs?.getString(keySeriesCache);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final List<dynamic> decoded = jsonDecode(jsonStr);
      return decoded.map((item) => SeriesModel.fromJson(item)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Limpa todo o cache local de conteúdos (acionado pelo botão 'Atualizar Conteúdo')
  Future<void> clearCache() async {
    await init();
    await _prefs?.remove(keyChannelsCache);
    await _prefs?.remove(keyMoviesCache);
    await _prefs?.remove(keySeriesCache);
  }
}
`
          },
          {
            id: 'channel_service.dart',
            name: 'channel_service.dart',
            path: 'lib/services/channel_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/channel_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 para fornecimento de canais de TV ao vivo com integração de servidor e cache
class ChannelService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<ChannelModel>> getChannels({
    required ContentApiService apiService,
    String? categoria,
    bool forceRefresh = false,
  }) async {
    // 1. Se não for atualização forçada, tenta carregar do cache local primeiro para agilidade
    if (!forceRefresh) {
      final cached = await _cacheService.getChannelsCache();
      if (cached != null && cached.isNotEmpty) {
        if (categoria == null || categoria == 'Todos' || categoria == 'todos') return cached;
        return cached.where((c) => c.categoria.toLowerCase() == categoria.toLowerCase()).toList();
      }
    }

    // 2. Busca do servidor real via ContentApiService
    final remoteChannels = await apiService.fetchLiveChannels();

    // 3. Salva no cache local
    await _cacheService.saveChannelsCache(remoteChannels);

    if (categoria == null || categoria == 'Todos' || categoria == 'todos') return remoteChannels;
    return remoteChannels.where((c) => c.categoria.toLowerCase() == categoria.toLowerCase()).toList();
  }
}
`
          },
          {
            id: 'movie_service.dart',
            name: 'movie_service.dart',
            path: 'lib/services/movie_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 para filmes integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/movie_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 para consulta do catálogo VOD de Filmes
class MovieService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<MovieModel>> getMovies({
    required ContentApiService apiService,
    String? categoria,
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh) {
      final cached = await _cacheService.getMoviesCache();
      if (cached != null && cached.isNotEmpty) {
        if (categoria == null || categoria == 'Todos' || categoria == 'todos') return cached;
        return cached.where((m) => m.categoria.toLowerCase() == categoria.toLowerCase()).toList();
      }
    }

    final remoteMovies = await apiService.fetchMovies();
    await _cacheService.saveMoviesCache(remoteMovies);

    if (categoria == null || categoria == 'Todos' || categoria == 'todos') return remoteMovies;
    return remoteMovies.where((m) => m.categoria.toLowerCase() == categoria.toLowerCase()).toList();
  }
}
`
          },
          {
            id: 'series_service.dart',
            name: 'series_service.dart',
            path: 'lib/services/series_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 7 de Séries integrado com ContentApiService e ContentCacheService',
            content: `import 'dart:async';
import '../models/series_model.dart';
import 'content_api_service.dart';
import 'content_cache_service.dart';

/// Serviço Módulo 7 de Séries
class SeriesService {
  final ContentCacheService _cacheService = ContentCacheService();

  Future<List<SeriesModel>> getSeries({
    required ContentApiService apiService,
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh) {
      final cached = await _cacheService.getSeriesCache();
      if (cached != null && cached.isNotEmpty) return cached;
    }

    final remoteSeries = await apiService.fetchSeries();
    await _cacheService.saveSeriesCache(remoteSeries);
    return remoteSeries;
  }
}
`
          },
          {
            id: 'favorites_service.dart',
            name: 'favorites_service.dart',
            path: 'lib/services/favorites_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 6 de favoritos com armazenamento local',
            content: `import 'package:shared_preferences/shared_preferences.dart';

/// Serviço Módulo 6 para gerenciar favoritos locais
class FavoritesService {
  static final FavoritesService _instance = FavoritesService._internal();
  factory FavoritesService() => _instance;
  FavoritesService._internal();

  SharedPreferences? _prefs;
  static const String keyFavoriteIds = 'streamflix_favorites_ids';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<List<String>> getFavoriteIds() async {
    await init();
    return _prefs?.getStringList(keyFavoriteIds) ?? [];
  }

  Future<bool> toggleFavorite(String id) async {
    await init();
    final favs = await getFavoriteIds();
    if (favs.contains(id)) {
      favs.remove(id);
    } else {
      favs.add(id);
    }
    return await _prefs?.setStringList(keyFavoriteIds, favs) ?? false;
  }
}
`
          },
          {
            id: 'player_service.dart',
            name: 'player_service.dart',
            path: 'lib/services/player_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 8 de Player de Vídeo - Controle de reprodução, URLs, áudio/vídeo, estados e liberação de memória',
            content: `import 'dart:async';
import 'package:flutter/material.dart';

/// Serviço Módulo 8 - Camada de Serviço de Reprodução de Vídeo
enum PlayerStatus { idle, loading, playing, paused, error, ended }

class PlayerService extends ChangeNotifier {
  PlayerStatus _status = PlayerStatus.idle;
  String? _mediaTitle;
  String? _mediaCategory;
  String? _streamUrl;
  String? _errorMessage;

  int _currentTimeInSeconds = 0;
  int _durationInSeconds = 7200;
  bool _isLiveStream = false;
  double _volume = 1.0;
  Timer? _playbackTimer;

  PlayerStatus get status => _status;
  String? get mediaTitle => _mediaTitle;
  String? get mediaCategory => _mediaCategory;
  String? get streamUrl => _streamUrl;
  String? get errorMessage => _errorMessage;
  int get currentTimeInSeconds => _currentTimeInSeconds;
  int get durationInSeconds => _durationInSeconds;
  bool get isLiveStream => _isLiveStream;
  double get volume => _volume;

  Future<void> openMedia({
    required String title,
    required String streamUrl,
    String? category,
    bool isLive = false,
    int initialPositionSeconds = 0,
    int duration = 7200,
  }) async {
    _status = PlayerStatus.loading;
    _mediaTitle = title;
    _streamUrl = streamUrl;
    _mediaCategory = category ?? (isLive ? 'TV AO VIVO' : 'VOD');
    _isLiveStream = isLive;
    _currentTimeInSeconds = initialPositionSeconds;
    _durationInSeconds = isLive ? 0 : duration;
    _errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 800));

    _status = PlayerStatus.playing;
    _startPlaybackTimer();
    notifyListeners();
  }

  void play() {
    if (_status == PlayerStatus.paused) {
      _status = PlayerStatus.playing;
      _startPlaybackTimer();
      notifyListeners();
    }
  }

  void pause() {
    if (_status == PlayerStatus.playing) {
      _status = PlayerStatus.paused;
      _playbackTimer?.cancel();
      notifyListeners();
    }
  }

  void seekTo(int seconds) {
    if (_isLiveStream) return;
    _currentTimeInSeconds = seconds.clamp(0, _durationInSeconds);
    notifyListeners();
  }

  void setVolume(double val) {
    _volume = val.clamp(0.0, 1.0);
    notifyListeners();
  }

  void _startPlaybackTimer() {
    _playbackTimer?.cancel();
    _playbackTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_status == PlayerStatus.playing) {
        if (!_isLiveStream) {
          _currentTimeInSeconds++;
          if (_currentTimeInSeconds >= _durationInSeconds) {
            _status = PlayerStatus.ended;
            _playbackTimer?.cancel();
          }
        }
        notifyListeners();
      }
    });
  }

  void disposePlayer() {
    _playbackTimer?.cancel();
    _status = PlayerStatus.idle;
    notifyListeners();
  }
}
`
          },
          {
            id: 'playback_progress_service.dart',
            name: 'playback_progress_service.dart',
            path: 'lib/services/playback_progress_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 8 de Progresso de Reprodução - Salva posição assistida de Filmes e Séries em SharedPreferences',
            content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Serviço Módulo 8 - Salva o progresso de reprodução para Filmes e Séries
class PlaybackProgressService {
  static final PlaybackProgressService _instance = PlaybackProgressService._internal();
  factory PlaybackProgressService() => _instance;
  PlaybackProgressService._internal();

  SharedPreferences? _prefs;
  static const String _keyProgress = 'streamflix_playback_progress_map';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> savePosition({
    required String mediaId,
    required int positionSeconds,
    required int durationSeconds,
  }) async {
    await init();
    final jsonStr = _prefs?.getString(_keyProgress) ?? '{}';
    Map<String, dynamic> map = jsonDecode(jsonStr);
    map[mediaId] = {
      'position': positionSeconds,
      'duration': durationSeconds,
      'updatedAt': DateTime.now().toIso8601String(),
    };
    await _prefs?.setString(_keyProgress, jsonEncode(map));
  }

  Future<int> getSavedPosition(String mediaId) async {
    await init();
    final jsonStr = _prefs?.getString(_keyProgress) ?? '{}';
    Map<String, dynamic> map = jsonDecode(jsonStr);
    if (map.containsKey(mediaId)) {
      return map[mediaId]['position'] ?? 0;
    }
    return 0;
  }
}
`
          },
          {
            id: 'theme_cache_service.dart',
            name: 'theme_cache_service.dart',
            path: 'lib/services/theme_cache_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 9 - Cache em SharedPreferences da Identidade Visual e Marca do Provedor',
            content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/provider_theme_model.dart';

/// Serviço Módulo 9 - Armazenamento Local da Marca do Provedor
class ThemeCacheService {
  static final ThemeCacheService _instance = ThemeCacheService._internal();
  factory ThemeCacheService() => _instance;
  ThemeCacheService._internal();

  SharedPreferences? _prefs;
  static const String keyCachedTheme = 'streamflix_cached_theme_json';

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> saveTheme(ProviderThemeModel theme) async {
    await init();
    await _prefs?.setString(keyCachedTheme, jsonEncode(theme.toJson()));
  }

  Future<ProviderThemeModel?> getCachedTheme() async {
    await init();
    final jsonStr = _prefs?.getString(keyCachedTheme);
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        final Map<String, dynamic> map = jsonDecode(jsonStr);
        return ProviderThemeModel.fromJson(map);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  Future<void> clearThemeCache() async {
    await init();
    await _prefs?.remove(keyCachedTheme);
  }
}
`
          },
          {
            id: 'theme_service.dart',
            name: 'theme_service.dart',
            path: 'lib/services/theme_service.dart',
            type: 'file',
            language: 'dart',
            description: 'Serviço Módulo 9 - Gerenciador do Tema Dinâmico Multi-Tenant com suporte a cores, logos e fallback sem reiniciar o aplicativo',
            content: `import 'package:flutter/material.dart';
import '../models/provider_theme_model.dart';
import 'theme_cache_service.dart';

/// Serviço Módulo 9 - Gerenciador do Tema Dinâmico Multi-Tenant (Troca em tempo real)
class ThemeService extends ChangeNotifier {
  ProviderThemeModel _currentTheme = ProviderThemeModel.defaultTheme();
  final ThemeCacheService _cacheService = ThemeCacheService();

  ProviderThemeModel get currentTheme => _currentTheme;
  Color get primaryColor => _currentTheme.primaryColor;
  Color get secondaryColor => _currentTheme.secondaryColor;
  String get providerName => _currentTheme.providerName;
  String get logoUrl => _currentTheme.logoUrl;
  String get welcomeMessage => _currentTheme.welcomeMessage;

  ThemeService() {
    loadSavedTheme();
  }

  Future<void> loadSavedTheme() async {
    final cached = await _cacheService.getCachedTheme();
    if (cached != null) {
      _currentTheme = cached;
      notifyListeners();
    }
  }

  Future<void> applyServerResponse(Map<String, dynamic> apiCentralResponse) async {
    _currentTheme = ProviderThemeModel.fromJson(apiCentralResponse);
    await _cacheService.saveTheme(_currentTheme);
    notifyListeners();
  }

  void updateThemeDirectly(ProviderThemeModel theme) {
    _currentTheme = theme;
    _cacheService.saveTheme(theme);
    notifyListeners();
  }

  ThemeData buildDynamicThemeData() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0A0A0A),
      primaryColor: primaryColor,
      colorScheme: ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: const Color(0xFF121212),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFF121212),
        elevation: 0,
        iconTheme: IconThemeData(color: secondaryColor),
      ),
      cardTheme: CardTheme(
        color: const Color(0xFF181818),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: primaryColor.withOpacity(0.3), width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}
`
          }
        ]
      },
      {
        id: 'repositories',
        name: 'repositories',
        path: 'lib/repositories',
        type: 'folder',
        children: [
          {
            id: 'auth_repository.dart',
            name: 'auth_repository.dart',
            path: 'lib/repositories/auth_repository.dart',
            type: 'file',
            language: 'dart',
            description: 'Repositório Módulo 4 orquestrando consulta à API Central, autenticação no servidor e salvamento da sessão',
            content: `import '../models/user_model.dart';
import '../models/server_model.dart';
import '../models/api_response_model.dart';
import '../models/auth_response_model.dart';
import '../services/server_service.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

/// Repositório de Autenticação Módulo 4 - Fluxo completo
class AuthRepository {
  final ServerService _serverService = ServerService();
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  /// Processo Módulo 4:
  /// 1. Consulta API Central via ServerService com o Código da Licença
  /// 2. Se não encontrar o servidor -> Lança Exception('Servidor não encontrado.')
  /// 3. Se servidor inativo -> Lança Exception('Não foi possível conectar ao servidor.')
  /// 4. Executa Autenticação via AuthService com Usuário e Senha no Servidor retornado
  /// 5. Se credenciais inválidas -> Lança Exception('Usuário ou senha inválidos.')
  /// 6. Salva a sessão do usuário com UserModel no StorageService
  Future<UserModel> authenticate({
    required String licenseCode,
    required String username,
    required String password,
  }) async {
    // 1. Validações Locais
    if (licenseCode.trim().isEmpty) {
      throw Exception('O Código da Licença é obrigatório.');
    }
    if (username.trim().isEmpty) {
      throw Exception('O Usuário é obrigatório.');
    }
    if (password.trim().isEmpty) {
      throw Exception('A Senha é obrigatória.');
    }

    // 2. Consulta API Central
    final ApiResponseModel apiResponse = await _serverService.fetchServerByCode(licenseCode);

    if (!apiResponse.success || apiResponse.server == null) {
      throw Exception('Servidor não encontrado.');
    }

    final ServerModel server = apiResponse.server!;

    if (server.status != 'active') {
      throw Exception('Não foi possível conectar ao servidor.');
    }

    // 3. Autentica no Servidor retornado
    final AuthResponseModel authResponse = await _authService.authenticateUser(
      server: server,
      username: username.trim(),
      password: password.trim(),
    );

    if (!authResponse.sucesso || authResponse.usuario == null) {
      throw Exception(authResponse.mensagem ?? 'Usuário ou senha inválidos.');
    }

    final UserModel user = authResponse.usuario!;

    // 4. Salva Sessão Completa no StorageService
    await _storageService.saveServerConfigAndCredentials(
      licenseCode: server.code,
      serverName: server.name,
      serverUrl: server.url,
      serverLogo: server.logo,
      username: username.trim(),
      password: password.trim(),
    );

    await _storageService.saveUserSession(user);

    return user;
  }

  Map<String, String> getSavedCredentials() {
    return _storageService.getSavedCredentials();
  }

  bool isAuthenticated() {
    return _storageService.isLoggedIn();
  }

  Future<void> logout() async {
    await _storageService.logout();
  }
}
`
          }
        ]
      },
      {
        id: 'screens',
        name: 'screens',
        path: 'lib/screens',
        type: 'folder',
        children: [
          {
            id: 'splash',
            name: 'splash',
            path: 'lib/screens/splash',
            type: 'folder',
            children: [
              {
                id: 'splash_screen.dart',
                name: 'splash_screen.dart',
                path: 'lib/screens/splash/splash_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de carregamento inicial com animação e verificação de sessão',
                content: `import 'package:flutter/material.dart';
import '../../config/routes.dart';
import '../../theme/app_colors.dart';
import '../../repositories/auth_repository.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final AuthRepository _authRepo = AuthRepository();

  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    if (_authRepo.isAuthenticated()) {
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else {
      Navigator.pushReplacementNamed(context, AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary, width: 2),
                boxShadow: const [
                  BoxShadow(
                    color: AppColors.primary,
                    blurRadius: 30,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.tv_rounded,
                size: 80,
                color: AppColors.secondary,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'STREAMFLIX TV',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Plataforma de Streaming para Smart TV',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 200,
              child: LinearProgressIndicator(
                color: AppColors.secondary,
                backgroundColor: AppColors.card,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'login',
            name: 'login',
            path: 'lib/screens/login',
            type: 'folder',
            children: [
              {
                id: 'login_screen.dart',
                name: 'login_screen.dart',
                path: 'lib/screens/login/login_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de Login Módulo 4 com Código da Licença, Usuário, Senha e autenticação completa',
                content: `import 'package:flutter/material.dart';
import '../../config/routes.dart';
import '../../theme/app_colors.dart';
import '../../repositories/auth_repository.dart';
import '../../widgets/focusable_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late TextEditingController _codeController;
  late TextEditingController _usernameController;
  late TextEditingController _passwordController;

  final AuthRepository _authRepository = AuthRepository();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Preencher automaticamente os dados salvos via SharedPreferences
    final savedCredentials = _authRepository.getSavedCredentials();
    _codeController = TextEditingController(text: savedCredentials['licenseCode']);
    _usernameController = TextEditingController(text: savedCredentials['username']);
    _passwordController = TextEditingController(text: savedCredentials['password']);
  }

  @override
  void dispose() {
    _codeController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _authRepository.authenticate(
        licenseCode: _codeController.text,
        username: _usernameController.text,
        password: _passwordController.text,
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } catch (e) {
      if (!mounted) return;
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
      backgroundColor: AppColors.background,
      body: Row(
        children: [
          // Painel Lateral Esquerdo (Branding Módulo 4)
          Expanded(
            flex: 4,
            child: Container(
              color: AppColors.card,
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.verified_user_rounded, size: 48, color: Colors.white),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'STREAMFLIX TV',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'MÓDULO 4 — Autenticação do Usuário. Consulta API Central + Login no Servidor resolvido.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
          
          // Formulário de Login com Suporte a Controle Remoto D-Pad
          Expanded(
            flex: 6,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 50),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Autenticação de Conta',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Informe o Código da Licença, Usuário e Senha para conectar',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    const SizedBox(height: 20),

                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.2),
                          border: Border.all(color: AppColors.error),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: AppColors.error, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Campo 1: Código da Licença
                    Focus(
                      child: Builder(
                        builder: (context) {
                          final hasFocus = Focus.of(context).hasFocus;
                          return Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: hasFocus ? AppColors.secondary : AppColors.card,
                                width: 2,
                              ),
                            ),
                            child: TextField(
                              controller: _codeController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Código da Licença',
                                prefixIcon: Icon(Icons.tag_rounded, color: AppColors.textSecondary),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.all(16),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Campo 2: Usuário Focusable
                    Focus(
                      child: Builder(
                        builder: (context) {
                          final hasFocus = Focus.of(context).hasFocus;
                          return Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: hasFocus ? AppColors.secondary : AppColors.card,
                                width: 2,
                              ),
                            ),
                            child: TextField(
                              controller: _usernameController,
                              decoration: const InputDecoration(
                                labelText: 'Usuário',
                                prefixIcon: Icon(Icons.person, color: AppColors.textSecondary),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.all(16),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Campo 3: Senha com botão Mostrar/Ocultar
                    Focus(
                      child: Builder(
                        builder: (context) {
                          final hasFocus = Focus.of(context).hasFocus;
                          return Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: hasFocus ? AppColors.secondary : AppColors.card,
                                width: 2,
                              ),
                            ),
                            child: TextField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'Senha',
                                prefixIcon: const Icon(Icons.lock, color: AppColors.textSecondary),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                    color: AppColors.textSecondary,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.all(16),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Botão ENTRAR com Indicador de Carregamento
                    FocusableButton(
                      label: _isLoading ? 'AUTENTICANDO NO SERVIDOR...' : 'ENTRAR',
                      onPressed: _isLoading ? null : _handleLogin,
                      icon: _isLoading ? null : Icons.login_rounded,
                      isPrimary: true,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'live_tv',
            name: 'live_tv',
            path: 'lib/screens/live_tv',
            type: 'folder',
            children: [
              {
                id: 'live_tv_screen.dart',
                name: 'live_tv_screen.dart',
                path: 'lib/screens/live_tv/live_tv_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de TV ao Vivo Módulo 5 com categorias laterais, cards de canais e espaço para EPG',
                content: `import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../widgets/channel_card.dart';
import '../../widgets/category_button.dart';

class LiveTvScreen extends StatefulWidget {
  const LiveTvScreen({super.key});

  @override
  State<LiveTvScreen> createState() => _LiveTvScreenState();
}

class _LiveTvScreenState extends State<LiveTvScreen> {
  int _selectedCategoryIndex = 0;

  final List<Map<String, dynamic>> _categories = [
    {'label': 'Todos os Canais', 'count': 240, 'icon': Icons.tv_rounded},
    {'label': 'Esportes Premium', 'count': 48, 'icon': Icons.sports_soccer_rounded},
    {'label': 'Jornalismo 24h', 'count': 32, 'icon': Icons.newspaper_rounded},
    {'label': 'Filmes & Séries', 'count': 85, 'icon': Icons.movie_rounded},
    {'label': 'Infantil & Kids', 'count': 40, 'icon': Icons.child_care_rounded},
    {'label': 'Variedades', 'count': 35, 'icon': Icons.public_rounded},
  ];

  final List<Map<String, String>> _channels = [
    {
      'name': 'Canal Premium HD',
      'category': 'Filmes & Séries',
      'nowShowing': 'Vingadores: Ultimato (4K HDR)',
      'nextShowing': 'O Poderoso Chefão II (1080p)',
      'badge': 'FHD 60FPS',
    },
    {
      'name': 'ESP Sports 4K',
      'category': 'Esportes',
      'nowShowing': 'Liga dos Campeões - Final',
      'nextShowing': 'Resenha Esportiva ao Vivo',
      'badge': '4K LIVE',
    },
    {
      'name': 'News 24h Brasil',
      'category': 'Jornalismo',
      'nowShowing': 'Jornal da Noite ao Vivo',
      'nextShowing': 'Análise Econômica Global',
      'badge': 'AO VIVO',
    },
    {
      'name': 'CineFilmes Gold',
      'category': 'Filmes & Séries',
      'nowShowing': 'Interestelar (Remasterizado)',
      'nextShowing': 'Matrix Resurrections',
      'badge': 'HD',
    },
    {
      'name': 'Kids World HD',
      'category': 'Infantil',
      'nowShowing': 'Aventuras na Floresta Mágica',
      'nextShowing': 'O Leão Guerreiro (Desenho)',
      'badge': 'LIVRE',
    },
    {
      'name': 'Cultura & Ciencia',
      'category': 'Variedades',
      'nowShowing': 'Segredos do Universo',
      'nextShowing': 'Expedição Oceano Profundo',
      'badge': '1080p',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sidebar de Categorias
          Container(
            width: 220,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CATEGORIAS',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.secondary,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: CategoryButton(
                          label: cat['label'],
                          icon: cat['icon'],
                          count: cat['count'],
                          isActive: _selectedCategoryIndex == index,
                          onPressed: () {
                            setState(() {
                              _selectedCategoryIndex = index;
                            });
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),

          // Grade Principal de Canais com Informação de Programa
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Grade de Canais ao Vivo',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary),
                      ),
                      child: const Text('EPG Ready', style: TextStyle(color: AppColors.secondary, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 1.6,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _channels.length,
                    itemBuilder: (context, index) {
                      final ch = _channels[index];
                      return ChannelCard(
                        name: ch['name']!,
                        category: ch['category']!,
                        nowShowing: ch['nowShowing']!,
                        nextShowing: ch['nextShowing']!,
                        badge: ch['badge'],
                        onTap: () {},
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'movies',
            name: 'movies',
            path: 'lib/screens/movies',
            type: 'folder',
            children: [
              {
                id: 'movies_screen.dart',
                name: 'movies_screen.dart',
                path: 'lib/screens/movies/movies_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de Filmes Módulo 5 com Hero Banner e carrossel de capas de catálogo',
                content: `import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../widgets/banner_card.dart';
import '../../widgets/movie_card.dart';

class MoviesScreen extends StatelessWidget {
  const MoviesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Principal
          const BannerCard(
            title: 'Avatar: O Caminho da Água',
            category: 'Ficção Científica / Ação',
            year: '2026',
            rating: '9.8',
            description: 'Jake Sully vive com sua nova família no planeta Pandora. Uma ameaça familiar retorna para terminar o que foi iniciado.',
            imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
          ),
          const SizedBox(height: 24),

          // Seção Destaques
          const Text(
            'Destaques da Semana',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 12),

          SizedBox(
            height: 220,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: const [
                MovieCard(
                  title: 'Top Gun: Maverick',
                  year: '2025',
                  duration: '2h 11m',
                  category: 'Ação',
                  rating: '9.5',
                  imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
                ),
                SizedBox(width: 12),
                MovieCard(
                  title: 'Duna: Parte 2',
                  year: '2026',
                  duration: '2h 46m',
                  category: 'Sci-Fi',
                  rating: '9.7',
                  imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
                ),
                SizedBox(width: 12),
                MovieCard(
                  title: 'O Batman',
                  year: '2025',
                  duration: '2h 56m',
                  category: 'Suspense',
                  rating: '9.2',
                  imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
                ),
                SizedBox(width: 12),
                MovieCard(
                  title: 'Oppenheimer',
                  year: '2025',
                  duration: '3h 00m',
                  category: 'Drama',
                  rating: '9.6',
                  imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=80',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'series',
            name: 'series',
            path: 'lib/screens/series',
            type: 'folder',
            children: [
              {
                id: 'series_screen.dart',
                name: 'series_screen.dart',
                path: 'lib/screens/series/series_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de Séries Módulo 5 com informações do show e estrutura de episódios',
                content: `import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class SeriesScreen extends StatelessWidget {
  const SeriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Banner da Série
        Container(
          width: double.infinity,
          height: 180,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10),
            gradient: LinearGradient(
              colors: [AppColors.primary.withOpacity(0.4), AppColors.card],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('Série Exclusiva', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
              const Text('Stranger Things 5', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 4),
              const Text('Com a fenda aberta em Hawkins, os heróis precisam se unir para derrotar o Vecna.', style: TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 8),
              const Text('4 Temporadas • 34 Episódios', style: TextStyle(color: AppColors.secondary, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 20),

        const Text('Temporada 1 — Episódios', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 12),

        Expanded(
          child: ListView(
            children: [
              _buildEpisodeItem('Episódio 1', 'O Resgate de Hawkins', '58m'),
              _buildEpisodeItem('Episódio 2', 'O Vazio do Mundo Invertido', '62m'),
              _buildEpisodeItem('Episódio 3', 'Plano de Defesa', '55m'),
              _buildEpisodeItem('Episódio 4', 'A Última Batalha', '75m'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEpisodeItem(String ep, String title, String duration) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          const Icon(Icons.play_circle_fill, color: AppColors.primary, size: 28),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('\$ep — \$title', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(duration, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'favorites',
            name: 'favorites',
            path: 'lib/screens/favorites',
            type: 'folder',
            children: [
              {
                id: 'favorites_screen.dart',
                name: 'favorites_screen.dart',
                path: 'lib/screens/favorites/favorites_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de Favoritos Módulo 5 preparada para canais, filmes e séries salvos',
                content: `import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.card,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary, width: 2),
            ),
            child: const Icon(Icons.favorite_rounded, color: AppColors.primary, size: 48),
          ),
          const SizedBox(height: 16),
          const Text(
            'Sua Lista de Favoritos',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 8),
          const Text(
            'Esta tela está pronta para receber canais, filmes e séries salvos na sua conta.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'settings',
            name: 'settings',
            path: 'lib/screens/settings',
            type: 'folder',
            children: [
              {
                id: 'settings_screen.dart',
                name: 'settings_screen.dart',
                path: 'lib/screens/settings/settings_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Tela de Configurações Módulo 5 com detalhes da conta, servidor e logout',
                content: `import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../repositories/auth_repository.dart';
import '../../config/routes.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AuthRepository authRepo = AuthRepository();
    final credentials = authRepo.getSavedCredentials();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Configurações da Conta',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 20),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: AppColors.primary,
                      child: Icon(Icons.person, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          credentials['username'] ?? 'Usuário Conectado',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const Text('Assinatura VIP Ativa', style: TextStyle(color: AppColors.success, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                const Divider(color: Colors.white10, height: 32),
                Text('Código da Licença: \${credentials[\'licenseCode\'] ?? \'100\'}', style: const TextStyle(color: Colors.white, fontSize: 13)),
                const SizedBox(height: 6),
                Text('Servidor Atual: \${credentials[\'serverName\'] ?? \'Servidor Premium\'}', style: const TextStyle(color: Colors.white, fontSize: 13)),
                const SizedBox(height: 20),

                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  ),
                  onPressed: () async {
                    await authRepo.logout();
                    if (!context.mounted) return;
                    Navigator.pushReplacementNamed(context, AppRoutes.login);
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sair da Conta'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`
              }
            ]
          },
          {
            id: 'home',
            name: 'home',
            path: 'lib/screens/home',
            type: 'folder',
            children: [
              {
                id: 'home_screen.dart',
                name: 'home_screen.dart',
                path: 'lib/screens/home/home_screen.dart',
                type: 'file',
                language: 'dart',
                description: 'Home Principal Módulo 5 com Top Bar de navegação por abas e suporte a D-Pad',
                content: `import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../repositories/auth_repository.dart';
import '../../widgets/menu_item.dart';
import '../live_tv/live_tv_screen.dart';
import '../movies/movies_screen.dart';
import '../series/series_screen.dart';
import '../favorites/favorites_screen.dart';
import '../settings/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTabIndex = 0;
  final AuthRepository _authRepository = AuthRepository();
  late Map<String, String> _credentials;

  final List<Map<String, dynamic>> _tabs = [
    {'label': 'TV AO VIVO', 'icon': Icons.live_tv_rounded},
    {'label': 'FILMES', 'icon': Icons.movie_rounded},
    {'label': 'SÉRIES', 'icon': Icons.tv_rounded},
    {'label': 'FAVORITOS', 'icon': Icons.favorite_rounded},
    {'label': 'CONFIGURAÇÕES', 'icon': Icons.settings_rounded},
  ];

  @override
  void initState() {
    super.initState();
    _credentials = _authRepository.getSavedCredentials();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Top Bar Header com Logo e Menu de Navegação por Abas
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.tv, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('STREAMFLIX TV', style: TextStyle(fontWeight: FontWeight.black, fontSize: 16, color: Colors.white)),
                          Text(_credentials['serverName'] ?? 'Servidor Premium', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                    ],
                  ),

                  // Menu de Abas da Top Bar
                  Row(
                    children: List.generate(_tabs.length, (index) {
                      final tab = _tabs[index];
                      return Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: CustomMenuItem(
                          label: tab['label'],
                          icon: tab['icon'],
                          isActive: _selectedTabIndex == index,
                          onPressed: () {
                            setState(() {
                              _selectedTabIndex = index;
                            });
                          },
                        ),
                      );
                    }),
                  ),

                  // Perfil do Usuário
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 16,
                        backgroundColor: AppColors.primary,
                        child: Icon(Icons.person, size: 18, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _credentials['username'] ?? 'Usuário',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Área Principal do Conteúdo
              Expanded(
                child: IndexedStack(
                  index: _selectedTabIndex,
                  children: const [
                    LiveTvScreen(),
                    MoviesScreen(),
                    SeriesScreen(),
                    FavoritesScreen(),
                    SettingsScreen(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`
              }
            ]
          }
        ]
      },
      {
        id: 'widgets',
        name: 'widgets',
        path: 'lib/widgets',
        type: 'folder',
        children: [
          {
            id: 'focusable_button.dart',
            name: 'focusable_button.dart',
            path: 'lib/widgets/focusable_button.dart',
            type: 'file',
            language: 'dart',
            description: 'Botão customizado com detecção de foco D-Pad para Smart TV',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class FocusableButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isPrimary;

  const FocusableButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isPrimary = false,
  });

  @override
  State<FocusableButton> createState() => _FocusableButtonState();
}

class _FocusableButtonState extends State<FocusableButton> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (hasFocus) {
        setState(() {
          _isFocused = hasFocus;
        });
      },
      child: GestureDetector(
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            color: _isFocused
                ? AppColors.secondary
                : (widget.isPrimary ? AppColors.primary : AppColors.card),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _isFocused ? Colors.white : Colors.transparent,
              width: 2,
            ),
            boxShadow: _isFocused
                ? [
                    BoxShadow(
                      color: AppColors.secondary.withOpacity(0.6),
                      blurRadius: 16,
                      spreadRadius: 2,
                    )
                  ]
                : [],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.icon != null) ...[
                Icon(
                  widget.icon,
                  size: 20,
                  color: AppColors.textPrimary,
                ),
                const SizedBox(width: 8),
              ],
              Text(
                widget.label,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'tv_card.dart',
            name: 'tv_card.dart',
            path: 'lib/widgets/tv_card.dart',
            type: 'file',
            language: 'dart',
            description: 'Card de streaming otimizado com expansão e brilho de foco D-Pad',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TVCard extends StatefulWidget {
  final String title;
  final String category;
  final IconData icon;
  final VoidCallback onTap;

  const TVCard({
    super.key,
    required this.title,
    required this.category,
    required this.icon,
    required this.onTap,
  });

  @override
  State<TVCard> createState() => _TVCardState();
}

class _TVCardState extends State<TVCard> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (hasFocus) {
        setState(() {
          _isFocused = hasFocus;
        });
      },
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedScale(
          scale: _isFocused ? 1.08 : 1.0,
          duration: const Duration(milliseconds: 180),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _isFocused ? AppColors.primary : AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isFocused ? AppColors.secondary : Colors.white10,
                width: _isFocused ? 3 : 1,
              ),
              boxShadow: _isFocused
                  ? [
                      BoxShadow(
                        color: AppColors.secondary.withOpacity(0.5),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ]
                  : [],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  widget.icon,
                  size: 36,
                  color: _isFocused ? Colors.white : AppColors.secondary,
                ),
                const SizedBox(height: 12),
                Text(
                  widget.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: _isFocused ? Colors.white : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.category,
                  style: TextStyle(
                    fontSize: 12,
                    color: _isFocused ? Colors.white70 : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'movie_card.dart',
            name: 'movie_card.dart',
            path: 'lib/widgets/movie_card.dart',
            type: 'file',
            language: 'dart',
            description: 'Widget de card de filme Módulo 5 com capa, informações e foco D-Pad',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class MovieCard extends StatefulWidget {
  final String title;
  final String year;
  final String duration;
  final String category;
  final String rating;
  final String imageUrl;

  const MovieCard({
    super.key,
    required this.title,
    required this.year,
    required this.duration,
    required this.category,
    required this.rating,
    required this.imageUrl,
  });

  @override
  State<MovieCard> createState() => _MovieCardState();
}

class _MovieCardState extends State<MovieCard> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (hasFocus) => setState(() => _isFocused = hasFocus),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 140,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _isFocused ? AppColors.primary : Colors.white10,
            width: _isFocused ? 2 : 1,
          ),
          boxShadow: _isFocused
              ? [BoxShadow(color: AppColors.primary.withOpacity(0.5), blurRadius: 12)]
              : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: Image.network(
                  widget.imageUrl,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: Colors.white10,
                    child: const Icon(Icons.movie, color: Colors.white30, size: 36),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '\${widget.year} • \${widget.duration}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'channel_card.dart',
            name: 'channel_card.dart',
            path: 'lib/widgets/channel_card.dart',
            type: 'file',
            language: 'dart',
            description: 'Widget de card de canal Módulo 5 com programa atual e próximo',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ChannelCard extends StatefulWidget {
  final String name;
  final String category;
  final String nowShowing;
  final String nextShowing;
  final String? badge;
  final VoidCallback onTap;

  const ChannelCard({
    super.key,
    required this.name,
    required this.category,
    required this.nowShowing,
    required this.nextShowing,
    this.badge,
    required this.onTap,
  });

  @override
  State<ChannelCard> createState() => _ChannelCardState();
}

class _ChannelCardState extends State<ChannelCard> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (hasFocus) => setState(() => _isFocused = hasFocus),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _isFocused ? AppColors.primary.withOpacity(0.2) : AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _isFocused ? AppColors.primary : Colors.white10,
              width: _isFocused ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(widget.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  if (widget.badge != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4)),
                      child: Text(widget.badge!, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Agora: \${widget.nowShowing}', style: const TextStyle(color: AppColors.secondary, fontSize: 11, fontWeight: FontWeight.w600), maxLines: 1),
                  Text('Próximo: \${widget.nextShowing}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 10), maxLines: 1),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'category_button.dart',
            name: 'category_button.dart',
            path: 'lib/widgets/category_button.dart',
            type: 'file',
            language: 'dart',
            description: 'Widget de botão de categoria Módulo 5 para navegação lateral em TV',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CategoryButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final int count;
  final bool isActive;
  final VoidCallback onPressed;

  const CategoryButton({
    super.key,
    required this.label,
    required this.icon,
    required this.count,
    required this.isActive,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isActive ? Colors.white : AppColors.textSecondary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isActive ? Colors.white : AppColors.textSecondary,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
                maxLines: 1,
              ),
            ),
            Text('\$count', style: const TextStyle(color: Colors.white30, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'banner_card.dart',
            name: 'banner_card.dart',
            path: 'lib/widgets/banner_card.dart',
            type: 'file',
            language: 'dart',
            description: 'Widget de Hero Banner Módulo 5 com fundo degradê e ações',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class BannerCard extends StatelessWidget {
  final String title;
  final String category;
  final String year;
  final String rating;
  final String description;
  final String imageUrl;

  const BannerCard({
    super.key,
    required this.title,
    required this.category,
    required this.year,
    required this.rating,
    required this.description,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        image: DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.black.withOpacity(0.9), Colors.transparent],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4)),
                  child: Text(category, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                Text('\$year • ★ \$rating', style: const TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.black, color: Colors.white)),
            const SizedBox(height: 6),
            SizedBox(
              width: 400,
              child: Text(description, style: const TextStyle(color: Colors.white70, fontSize: 12), maxLines: 2),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {},
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('Assistir Agora'),
            ),
          ],
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'menu_item.dart',
            name: 'menu_item.dart',
            path: 'lib/widgets/menu_item.dart',
            type: 'file',
            language: 'dart',
            description: 'Widget de item da top bar Módulo 5 com destaque de seleção',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CustomMenuItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback onPressed;

  const CustomMenuItem({
    super.key,
    required this.label,
    required this.icon,
    required this.isActive,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isActive ? AppColors.primary : Colors.white10),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isActive ? Colors.white : AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : AppColors.textSecondary,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
          },
          {
            id: 'loading_widget.dart',
            name: 'loading_widget.dart',
            path: 'lib/widgets/loading_widget.dart',
            type: 'file',
            language: 'dart',
            description: 'Widget de carregamento estilizado Módulo 5 com spinner Roxo',
            content: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          if (message != null) ...[
            const SizedBox(height: 12),
            Text(message!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ]
        ],
      ),
    );
  }
}
`
          },
          {
            id: 'dpad_navigation_wrapper.dart',
            name: 'dpad_navigation_wrapper.dart',
            path: 'lib/widgets/dpad_navigation_wrapper.dart',
            type: 'file',
            language: 'dart',
            description: 'Wrapper para interceptar e tratar eventos de navegação D-Pad em telas',
            content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class DPadNavigationWrapper extends StatelessWidget {
  final Widget child;
  final VoidCallback? onSelectPressed;
  final VoidCallback? onBackPressed;

  const DPadNavigationWrapper({
    super.key,
    required this.child,
    this.onSelectPressed,
    this.onBackPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Focus(
      autofocus: true,
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent) {
          if (event.logicalKey == LogicalKeyboardKey.select ||
              event.logicalKey == LogicalKeyboardKey.enter) {
            onSelectPressed?.call();
            return KeyEventResult.handled;
          }
          if (event.logicalKey == LogicalKeyboardKey.goBack ||
              event.logicalKey == LogicalKeyboardKey.escape) {
            onBackPressed?.call();
            return KeyEventResult.handled;
          }
        }
        return KeyEventResult.ignored;
      },
      child: child,
    );
  }
}
`
          }
        ]
      },
      {
        id: 'utils',
        name: 'utils',
        path: 'lib/utils',
        type: 'folder',
        children: [
          {
            id: 'tv_key_events.dart',
            name: 'tv_key_events.dart',
            path: 'lib/utils/tv_key_events.dart',
            type: 'file',
            language: 'dart',
            description: 'Utilitário global de escuta de atalhos e botões de controle remoto',
            content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class TVKeyEventWrapper extends StatelessWidget {
  final Widget child;

  const TVKeyEventWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return RawKeyboardListener(
      focusNode: FocusNode(),
      onKey: (RawKeyEvent event) {
        if (event is RawKeyDownEvent) {
          // Log ou tratamento centralizado de atalhos de Smart TV / Fire TV
          if (event.logicalKey == LogicalKeyboardKey.arrowUp) {
            // Evento Direcional CIMA
          } else if (event.logicalKey == LogicalKeyboardKey.arrowDown) {
            // Evento Direcional BAIXO
          } else if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
            // Evento Direcional ESQUERDA
          } else if (event.logicalKey == LogicalKeyboardKey.arrowRight) {
            // Evento Direcional DIREITA
          }
        }
      },
      child: child,
    );
  }
}
`
          }
        ]
      }
    ]
  }
];
