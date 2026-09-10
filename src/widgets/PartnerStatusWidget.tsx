import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { colors, signalColorMap, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface PartnerStatusWidgetProps {
  status: {
    nickname: string;
    color: SignalColor;
    caption: string;
  } | null;
}

export function PartnerStatusWidget({ status }: PartnerStatusWidgetProps) {
  if (!status) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: colors.card,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text="연결된 파트너가 없어요"
          style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.medium }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <FlexWidget
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: signalColorMap[status.color] as `#${string}`,
        }}
      />
      <FlexWidget
        style={{
          marginLeft: 12,
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={status.nickname}
          style={{ fontSize: 14, color: colors.ink, fontFamily: fonts.semiBold }}
        />
        <TextWidget
          text={status.caption}
          style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.regular }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
