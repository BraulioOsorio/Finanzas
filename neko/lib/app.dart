import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'reverse_engineered/credit_card_bloc.dart';
import 'reverse_engineered/financial_plan_bloc.dart';
import 'reverse_engineered/safe_to_spend_bloc.dart';
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
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => SafeToSpendBloc()..initialize()),
        BlocProvider(create: (_) => CreditCardBloc()),
        BlocProvider(create: (_) => FinancialPlanBloc()),
      ],
      child: MaterialApp(
        title: 'Neko',
        debugShowCheckedModeBanner: false,
        theme: buildNekoTheme(),
        home: const NekoShell(),
      ),
    );
  }
}