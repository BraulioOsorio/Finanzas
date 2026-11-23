import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../cubit/neko_data_cubit.dart';
import '../services/neko_database.dart';
import '../theme/neko_theme.dart';
import '../widgets/neko_background.dart';

class ImportScreen extends StatelessWidget {
  const ImportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Importar')),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'En NEKO: Ajustes → exportar «Neko - My Data».\n'
                'Elige ese archivo aquí (reemplaza datos en esta app).',
                style: TextStyle(color: NekoColors.textMuted, height: 1.4),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => _pickAndImport(context),
                icon: const Icon(Icons.folder_open),
                label: const Text('Elegir Neko - My Data'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickAndImport(BuildContext context) async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      withData: false,
    );
    if (result == null || result.files.single.path == null) return;
    final file = File(result.files.single.path!);
    try {
      await NekoDatabase.instance.importBackup(file);
      if (!context.mounted) return;
      await context.read<NekoDataCubit>().refresh();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Backup importado. Datos de NEKO cargados.')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }
}