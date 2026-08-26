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
