import { WidgetTaskHandler } from 'react-native-android-widget';
import { loadPartnerStatus } from '../lib/partnerStatusCache';
import { PartnerStatusWidget } from './PartnerStatusWidget';

export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') return;
  const status = await loadPartnerStatus();
  renderWidget(<PartnerStatusWidget status={status} />);
};
