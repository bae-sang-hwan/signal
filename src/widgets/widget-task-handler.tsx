import { WidgetTaskHandler } from 'react-native-android-widget';
import { getWidgetOpacity, loadWidgetStatuses } from '../lib/partnerStatusCache';
import { getWidgetTranslation } from '../i18n';
import { PartnerStatusWidget } from './PartnerStatusWidget';

export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') return;
  const [statuses, opacity, emptyText] = await Promise.all([
    loadWidgetStatuses(),
    getWidgetOpacity(),
    getWidgetTranslation('widget.empty'),
  ]);
  renderWidget(<PartnerStatusWidget statuses={statuses} emptyText={emptyText} opacity={opacity} />);
};
