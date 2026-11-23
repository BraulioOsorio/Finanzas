import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'reverse_engineered/credit_card_bloc.dart';
import 'reverse_engineered/financial_plan_bloc.dart';
import 'reverse_engineered/safe_to_spend_bloc.dart';

class NekoForkApp extends StatelessWidget {
  const NekoForkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => SafeToSpendBloc()..initialize()),
        BlocProvider(create: (_) => CreditCardBloc()),
        BlocProvider(create: (_) => FinancialPlanBloc()),
      ],
      child: MaterialApp(
        title: 'NEKO Fork',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const _HomePlaceholder(),
      ),
    );
  }
}

class _HomePlaceholder extends StatelessWidget {
  const _HomePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/apk/images/background_dark.png'),
            fit: BoxFit.cover,
            opacity: 0.35,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Disponible para gastar',
                  style: TextStyle(
                    fontFamily: 'HankenGrotesk',
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Proyecto Flutter en neko/. Edita lib/reverse_engineered/ y pantallas nuevas.',
                ),
                const Spacer(),
                Text(
                  'Paquete original: com.tuxedolab.paycheckbuddy',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}