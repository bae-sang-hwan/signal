import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';
import { colors, hexToRgba, signalColorMap, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface PartnerStatusWidgetProps {
  statuses: {
    uid: string;
    nickname: string;
    color: SignalColor;
    caption: string;
  }[];
  emptyText: string;
  opacity?: number;
}

export function PartnerStatusWidget({ statuses, emptyText, opacity = 1 }: PartnerStatusWidgetProps) {
  const backgroundColor = hexToRgba(colors.card, opacity);

  if (statuses.length === 0) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={emptyText}
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
        backgroundColor,
        borderRadius: 20,
        padding: 8,
      }}
    >
      <ListWidget style={{ height: 'match_parent', width: 'match_parent' }}>
        {statuses.map((status) => (
          <FlexWidget
            key={status.uid}
            clickAction="OPEN_APP"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              paddingHorizontal: 8,
              paddingVertical: 5,
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
      </ListWidget>
    </FlexWidget>
  );
}
