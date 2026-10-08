# Configuração de Build Android (Flutter)

Siga os passos abaixo para gerar o APK e AAB oficiais do aplicativo Flutter.

## 1. Nome do Pacote (Package Name)
O nome do pacote foi configurado para ser exclusivo em `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.streamflix.tvapp"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

## 2. Ícone Oficial e Splash Screen
- Coloque as imagens do ícone nas pastas `android/app/src/main/res/mipmap-*`.
- A splash screen nativa está configurada no `launch_background.xml`.

## 3. Assinatura do APK/AAB (Release)
1. Crie uma chave de upload:
```bash
keytool -genkey -v -keystore release-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
2. Configure o arquivo `android/key.properties`:
```properties
storePassword=sua_senha
keyPassword=sua_senha
keyAlias=upload
storeFile=../release-key.keystore
```
3. No `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        def keyProperties = new Properties()
        def keyPropertiesFile = rootProject.file('key.properties')
        if (keyPropertiesFile.exists()) {
            keyProperties.load(new FileInputStream(keyPropertiesFile))
            storeFile file(keyProperties['storeFile'])
            storePassword keyProperties['storePassword']
            keyAlias keyProperties['keyAlias']
            keyPassword keyProperties['keyPassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

## 4. Geração do APK/AAB
Para gerar o AAB (Recomendado para Play Store):
```bash
flutter build appbundle --release
```

Para gerar o APK (Instalação direta):
```bash
flutter build apk --release
```

O arquivo gerado estará em `build/app/outputs/flutter-apk/app-release.apk`.

## Diagnóstico de desempenho do EPG

Em uma TV Android ou emulador com sessão válida, execute:

```bash
flutter run --dart-define=EPG_DIAGNOSTICS=true
```

Os logs `EPG central` mostram quantidade de canais, correspondências, status HTTP, tempo da chamada, bytes decodificados, `Content-Encoding`, disponibilidade e origem da resposta. Os logs `EPG visible`, `EPG focused` e `EPG background` mostram o tempo até a atualização da interface. Nenhum token ou nome de canal é registrado. Em builds de debug, esses logs já ficam ativos; em outros builds, use a flag acima para ativá-los.

## Verificação de acesso do provedor

Ao abrir ou retomar o app, a sessão de provedor consulta `POST /api/v1/provider/license/status` com o token salvo e o código do provedor. Uma autorização positiva é reutilizada pelo intervalo `next_check_seconds` informado pela API, limitado a no máximo 24 horas. Resposta `access_allowed: false` ou HTTP 403 encerra a sessão e mostra um aviso para contatar o revendedor ou provedor. Falha de rede ou erro temporário não desloga o usuário e a verificação é tentada novamente no próximo acesso. Quando o token vence, o app tenta renová-lo pelo login com as credenciais Xtream já salvas antes da consulta de status.
