import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { colors, signalColorMap, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface PartnerStatusWidgetProps {
  statuses: {
    uid: string;
    nickname: string;
    color: SignalColor;
    caption: string;
  }[];
}

export function PartnerStatusWidget({ statuses }: PartnerStatusWidgetProps) {
  if (statuses.length === 0) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
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
          text="연결된 사람이 없어요"
          style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.medium }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 8,
      }}
    >
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
        {statuses.map((status) => (
          <FlexWidget
            key={status.uid}
            clickAction="OPEN_APP"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              padding: 8,
            }}
          >
            <FlexWidget
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
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
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
