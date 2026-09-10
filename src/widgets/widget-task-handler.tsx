import { WidgetTaskHandler } from 'react-native-android-widget';
import { loadWidgetStatuses } from '../lib/partnerStatusCache';
import { PartnerStatusWidget } from './PartnerStatusWidget';

export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') return;
  const statuses = await loadWidgetStatuses();
  renderWidget(<PartnerStatusWidget statuses={statuses} />);
};
