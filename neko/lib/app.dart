import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'cubit/neko_data_cubit.dart';
import 'shell/neko_shell.dart';
import 'theme/neko_theme.dart';

class NekoForkApp extends StatelessWidget {
  const NekoForkApp({super.key});

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarBrightness: Brightness.dark,
        statusBarIconBrightness: Brightness.light,
      ),
    );
    return BlocProvider(
      create: (_) => NekoDataCubit(),
      child: MaterialApp(
        title: 'Neko',
        debugShowCheckedModeBanner: false,
        theme: buildNekoTheme(),
        home: const NekoShell(),
      ),
    );
  }
}