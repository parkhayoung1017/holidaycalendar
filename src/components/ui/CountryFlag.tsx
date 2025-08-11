import React, { useState, useEffect } from 'react';

interface CountryFlagProps {
    countryCode: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    fallbackText?: string;
}

const CountryFlag: React.FC<CountryFlagProps> = ({
    countryCode,
    className = '',
    size = 'md',
    fallbackText
}) => {
    const [flagRenderMethod, setFlagRenderMethod] = useState<'emoji' | 'svg' | 'fallback'>('emoji');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 윈도우 환경에서 국기 지원 여부를 더 정확하게 확인
        const checkFlagSupport = async () => {
            if (typeof window === 'undefined') return 'emoji';

            // 윈도우 환경이 아니면 항상 국기 이모지 사용
            if (!/Windows/.test(navigator.userAgent)) {
                return 'emoji';
            }

            // 윈도우 버전 확인
            const windowsVersion = navigator.userAgent.match(/Windows NT (\d+\.\d+)/);
            if (windowsVersion) {
                const version = parseFloat(windowsVersion[1]);

                // Windows 10 (NT 10.0) 이상에서는 더 적극적으로 이모지 시도
                if (version >= 10.0) {
                    // 먼저 이모지를 시도하고, 실패하면 SVG 폴백
                    const emojiSupported = await testEmojiRendering();
                    if (emojiSupported) {
                        return 'emoji';
                    }

                    // 이모지가 지원되지 않으면 SVG 시도
                    return 'svg';
                }
            }

            // 구버전 윈도우는 바로 폴백
            return 'fallback';
        };

        // 실제 이모지 렌더링 테스트 (더 관대한 기준)
        const testEmojiRendering = (): Promise<boolean> => {
            return new Promise((resolve) => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        resolve(false);
                        return;
                    }

                    // 윈도우에서 가장 잘 작동하는 폰트들 우선 테스트
                    const fonts = [
                        '32px "Segoe UI Emoji"',
                        '32px "Segoe UI Symbol"',
                        '32px "Microsoft YaHei"',
                        '32px "Noto Color Emoji"',
                        '32px system-ui'
                    ];

                    let bestResult = false;

                    for (const font of fonts) {
                        ctx.clearRect(0, 0, 64, 64);
                        ctx.font = font;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🇰🇷', 32, 32);

                        const imageData = ctx.getImageData(0, 0, 64, 64);
                        let pixelCount = 0;

                        // 더 관대한 기준으로 픽셀 확인
                        for (let i = 0; i < imageData.data.length; i += 4) {
                            const r = imageData.data[i];
                            const g = imageData.data[i + 1];
                            const b = imageData.data[i + 2];
                            const a = imageData.data[i + 3];

                            // 투명하지 않은 픽셀이 있으면 카운트
                            if (a > 50) {
                                pixelCount++;
                            }
                        }

                        // 50개 이상의 픽셀이 있으면 지원됨으로 판단 (더 관대한 기준)
                        if (pixelCount > 50) {
                            bestResult = true;
                            break;
                        }
                    }

                    resolve(bestResult);
                } catch (error) {
                    // 오류 발생시에도 일단 시도해보도록 true 반환
                    resolve(true);
                }
            });
        };

        checkFlagSupport().then(method => {
            setFlagRenderMethod(method);
            setIsLoading(false);
        });
    }, []);

    // 국가 코드를 국기 이모지로 변환
    const getCountryFlag = (code: string): string => {
        const upperCode = code.toUpperCase();

        // 국가 코드를 유니코드 국기 이모지로 변환
        const codePoints = upperCode
            .split('')
            .map(char => 127397 + char.charCodeAt(0));

        return String.fromCodePoint(...codePoints);
    };

    // SVG 국기 생성 (간단한 컬러 박스 형태)
    const getSVGFlag = (code: string) => {
        const colors = {
            'KR': ['#CD2E3A', '#0047A0'], // 한국: 빨강, 파랑
            'JP': ['#BC002D', '#FFFFFF'], // 일본: 빨강, 흰색
            'CN': ['#DE2910', '#FFDE00'], // 중국: 빨강, 노랑
            'US': ['#B22234', '#FFFFFF', '#3C3B6E'], // 미국: 빨강, 흰색, 파랑
            'GB': ['#012169', '#FFFFFF', '#C8102E'], // 영국: 파랑, 흰색, 빨강
            'DE': ['#000000', '#DD0000', '#FFCE00'], // 독일: 검정, 빨강, 노랑
            'FR': ['#0055A4', '#FFFFFF', '#EF4135'], // 프랑스: 파랑, 흰색, 빨강
            'CA': ['#FF0000', '#FFFFFF'], // 캐나다: 빨강, 흰색
            'AU': ['#012169', '#FFFFFF', '#E4002B'], // 호주: 파랑, 흰색, 빨강
            'SG': ['#ED2939', '#FFFFFF'] // 싱가포르: 빨강, 흰색
        };

        const flagColors = colors[code as keyof typeof colors] || ['#6B7280', '#9CA3AF'];

        return (
            <svg width="20" height="14" viewBox="0 0 20 14" className="inline-block">
                <rect width="20" height="14" fill={flagColors[0]} />
                {flagColors[1] && (
                    <rect width="20" height="7" y="7" fill={flagColors[1]} />
                )}
                {flagColors[2] && (
                    <rect width="20" height="5" y="9" fill={flagColors[2]} />
                )}
            </svg>
        );
    };

    const sizeStyles = {
        sm: { fontSize: '16px' },
        md: { fontSize: '20px' },
        lg: { fontSize: '24px' }
    };

    const fallbackSizeClasses = {
        sm: 'w-5 h-3 text-xs',
        md: 'w-6 h-4 text-xs',
        lg: 'w-8 h-5 text-sm'
    };

    // 로딩 중
    if (isLoading) {
        return (
            <div
                className={`inline-flex items-center justify-center bg-gray-100 ${fallbackSizeClasses[size]} ${className}`}
                title={`${countryCode} flag loading...`}
            >
                <div className="animate-pulse bg-gray-300 w-full h-full rounded"></div>
            </div>
        );
    }

    // SVG 폴백 사용
    if (flagRenderMethod === 'svg') {
        return (
            <span
                className={`inline-block ${className}`}
                title={`${countryCode} flag`}
            >
                {getSVGFlag(countryCode)}
            </span>
        );
    }

    // 텍스트 폴백 사용
    if (flagRenderMethod === 'fallback') {
        return (
            <div
                className={`inline-flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-bold rounded-md border border-blue-300 shadow-sm ${fallbackSizeClasses[size]} ${className}`}
                title={`${countryCode} flag`}
            >
                {fallbackText || countryCode}
            </div>
        );
    }

    // 국기 이모지 사용 (flag-emoji 클래스 적용)
    return (
        <span
            className={`inline-block flag-emoji ${className}`}
            style={sizeStyles[size]}
            title={`${countryCode} flag`}
        >
            {getCountryFlag(countryCode)}
        </span>
    );
};

export default CountryFlag;