# Compilação e Distribuição do Aplicativo (Flutter)

O aplicativo foi desenvolvido utilizando o Flutter. Para gerar as versões de distribuição (APK e AAB), certifique-se de ter o ambiente Flutter (SDK >= 3.0.0) instalado em sua máquina local. O build não pode ser gerado diretamente pelo servidor Node.js/Cloud Run.

## Variáveis de Ambiente
Antes de compilar, ajuste a URL da API em `flutter_app/lib/api_service.dart` ou injete via `--dart-define`:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.seuservidor.com
```

## Geração do APK (Para testes e Android TV)
Execute na pasta `flutter_app`:
```bash
flutter build apk --release
```
O arquivo será gerado em: `build/app/outputs/flutter-apk/app-release.apk`

## Geração do AAB (Para Play Store)
Execute na pasta `flutter_app`:
```bash
flutter build appbundle --release
```
O arquivo será gerado em: `build/app/outputs/bundle/release/app-release.aab`

## Assinatura (Keystore)
Para a versão release, configure seu keystore em `android/key.properties`:
```properties
storePassword=suasenha
keyPassword=suasenha
keyAlias=upload
storeFile=../release.keystore
```
**NUNCA adicione o keystore ao repositório git!**

## Dependências Utilizadas
- `http`: Requisições para o backend.
- `shared_preferences`: Armazenamento de sessão seguro.
- `device_info_plus`: Identificação estável e confiável do Device ID (sem depender de MAC Address).

## Limitações do Ambiente
No atual ambiente (AI Studio), a compilação Flutter não pode ser realizada por ausência do SDK (`flutter`). Todo o código em Dart já foi ajustado, sem mockups e pronto para consumir a API real. Faça a compilação no seu ambiente de build local ou CI/CD (ex: GitHub Actions, Codemagic).
