import 'package:flutter/material.dart';

/// Punto de entrada del clon editable. Conecta UI cuando Flutter esté instalado.
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FinanzasNekoApp());
}

class FinanzasNekoApp extends StatelessWidget {
  const FinanzasNekoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Finanzas NEKO (fork)',
      theme: ThemeData.dark(useMaterial3: true),
      home: const Scaffold(
        body: Center(
          child: Text(
            'neko_app: edita lib/ y reverse_engineered/\n'
            'Expo (raíz): npm start',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}