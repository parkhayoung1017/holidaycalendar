#!/usr/bin/env tsx

import { TranslationValidator, ValidationResult } from '../src/lib/translation-validator';
import chalk from 'chalk';

/**
 * 번역 파일 검증 스크립트
 * 
 * 사용법:
 * npm run validate-translations
 * npx tsx scripts/validate-translations.ts
 * npx tsx scripts/validate-translations.ts --strict  # 경고도 오류로 처리
 * npx tsx scripts/validate-translations.ts --file common.json  # 특정 파일만 검증
 */

interface ScriptOptions {
  strict: boolean;
  file?: string;
  verbose: boolean;
  exitOnError: boolean;
}

class TranslationValidationScript {
  private validator: TranslationValidator;
  private options: ScriptOptions;

  constructor(options: ScriptOptions) {
    this.validator = new TranslationValidator();
    this.options = options;
  }

  async run(): Promise<void> {
    console.log(chalk.blue('🔍 번역 파일 검증을 시작합니다...\n'));

    try {
      let result: ValidationResult;

      if (this.options.file) {
        console.log(chalk.cyan(`📄 특정 파일 검증: ${this.options.file}`));
        result = await this.validator.validateTranslationFile(this.options.file);
      } else {
        console.log(chalk.cyan('📁 모든 번역 파일 검증'));
        result = await this.validator.validateAll();
      }

      this.printResults(result);
      this.printSummary(result);
      this.printCompleteness(result);

      // 종료 코드 결정
      const hasErrors = result.errors.length > 0;
      const hasWarnings = result.warnings.length > 0;
      const shouldExit = hasErrors || (this.options.strict && hasWarnings);

      if (shouldExit && this.options.exitOnError) {
        process.exit(1);
      } else if (hasErrors || hasWarnings) {
        console.log(chalk.yellow('\n⚠️  검증 완료 (문제 발견)'));
      } else {
        console.log(chalk.green('\n✅ 모든 번역 파일이 유효합니다!'));
      }

    } catch (error) {
      console.error(chalk.red('❌ 검증 중 오류 발생:'), error);
      if (this.options.exitOnError) {
        process.exit(1);
      }
    }
  }

  private printResults(result: ValidationResult): void {
    // 오류 출력
    if (result.errors.length > 0) {
      console.log(chalk.red(`\n❌ 오류 (${result.errors.length}개):`));
      for (const error of result.errors) {
        console.log(chalk.red(`  • ${error.message}`));
        if (this.options.verbose) {
          console.log(chalk.gray(`    파일: ${error.file}`));
          console.log(chalk.gray(`    언어: ${error.locale}`));
          if (error.key) {
            console.log(chalk.gray(`    키: ${error.key}`));
          }
        }
      }
    }

    // 경고 출력
    if (result.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  경고 (${result.warnings.length}개):`));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  • ${warning.message}`));
        if (this.options.verbose) {
          console.log(chalk.gray(`    파일: ${warning.file}`));
          console.log(chalk.gray(`    언어: ${warning.locale}`));
          if (warning.key) {
            console.log(chalk.gray(`    키: ${warning.key}`));
          }
        }
      }
    }
  }

  private printSummary(result: ValidationResult): void {
    console.log(chalk.blue('\n📊 검증 요약:'));
    console.log(`  총 파일 수: ${result.summary.totalFiles}`);
    console.log(`  유효한 파일: ${chalk.green(result.summary.validFiles.toString())}`);
    
    if (result.summary.missingFiles > 0) {
      console.log(`  누락된 파일: ${chalk.red(result.summary.missingFiles.toString())}`);
    }
    
    if (result.summary.missingKeys > 0) {
      console.log(`  누락된 키: ${chalk.red(result.summary.missingKeys.toString())}`);
    }
    
    if (result.summary.extraKeys > 0) {
      console.log(`  추가 키: ${chalk.yellow(result.summary.extraKeys.toString())}`);
    }
  }

  private printCompleteness(result: ValidationResult): void {
    const completeness = this.validator.calculateCompleteness(result);
    
    console.log(chalk.blue('\n📈 번역 완성도:'));
    console.log(`  파일 완성도: ${this.getColoredPercentage(completeness.fileCompleteness)}%`);
    console.log(`  키 완성도: ${this.getColoredPercentage(completeness.keyCompleteness)}%`);
    console.log(`  전체 점수: ${this.getColoredPercentage(completeness.overallScore)}%`);

    if (completeness.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 권장사항:'));
      for (const recommendation of completeness.recommendations) {
        console.log(chalk.cyan(`  • ${recommendation}`));
      }
    }
  }

  private getColoredPercentage(percentage: number): string {
    const rounded = Math.round(percentage);
    if (rounded >= 90) return chalk.green(rounded.toString());
    if (rounded >= 70) return chalk.yellow(rounded.toString());
    return chalk.red(rounded.toString());
  }
}

// CLI 인자 파싱
function parseArguments(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    strict: false,
    verbose: false,
    exitOnError: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--strict':
        options.strict = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--no-exit':
        options.exitOnError = false;
        break;
      case '--file':
        if (i + 1 < args.length) {
          options.file = args[i + 1];
          i++; // 다음 인자 건너뛰기
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(chalk.blue('번역 파일 검증 스크립트'));
  console.log('\n사용법:');
  console.log('  npm run validate-translations');
  console.log('  npx tsx scripts/validate-translations.ts [옵션]');
  console.log('\n옵션:');
  console.log('  --strict        경고도 오류로 처리');
  console.log('  --file <name>   특정 파일만 검증 (예: common.json)');
  console.log('  --verbose, -v   상세한 정보 출력');
  console.log('  --no-exit       오류 발생 시에도 종료하지 않음');
  console.log('  --help, -h      도움말 출력');
}

// 스크립트 실행
async function main() {
  const options = parseArguments();
  const script = new TranslationValidationScript(options);
  await script.run();
}

// 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main().catch(console.error);
}

export { TranslationValidationScript };