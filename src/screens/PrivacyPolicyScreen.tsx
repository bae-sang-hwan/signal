import { ScrollView, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useTranslation } from '../i18n';
import { CONTACT_EMAIL } from '../lib/contact';

const APP_NAME = 'SignalMate';

export function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const params = { app: APP_NAME, email: CONTACT_EMAIL };

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('privacyPolicy.title')}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.paragraph}>{t('privacyPolicy.intro', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.purposeHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.purposeBody', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.itemsHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.itemsBody', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.thirdPartyHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.thirdPartyBody', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.retentionHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.retentionBody', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.rightsHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.rightsBody', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.contactHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.contactBody', params)}</Text>

        <Text style={styles.heading}>{t('privacyPolicy.changesHeading')}</Text>
        <Text style={styles.paragraph}>{t('privacyPolicy.changesBody', params)}</Text>

        <Text style={styles.footer}>{t('privacyPolicy.effectiveDate')}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 30,
  },
  scroll: {
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 18,
  },
  heading: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.muted,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.faint,
    marginTop: 28,
  },
});
