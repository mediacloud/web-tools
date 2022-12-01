import React from 'react';
import { injectIntl } from 'react-intl';
import TextField from '@material-ui/core/TextField';
import messages from '../../resources/messages';

/*
 * This requies `tagUtil.mediaSourceMetadataProps(source)` to have been called in the reducer to fill
 * in the named metadata properties on the source object.
 */
const PrivacyPolicyContainer = () => {
  const privacyText = `Effective date: March 29, 2019 
    This privacy policy discloses the privacy practices of Media Cloud, a joint project of the MIT Center for Civic Media and the Berkman Klein Center for Internet & Society at Harvard University. Media Cloud is based at 20 Ames Street, Cambridge, MA 02139, USA. This privacy policy applies only to both the Media Cloud Website (“Website”), accessible at mediacloud.org, and the Media Cloud Tools and Platform (“Platform”), accessible at tools.mediacloud.org. This privacy policy does not apply to other projects of the Center for Civic Media or the Berkman Klein Center. \
    
    Media Cloud is committed to the privacy of its users. Therefore, Media Cloud is committed to collecting and using personal data only for the reasons specified in this Privacy Policy, collecting, using, and retaining only as much information as needed to achieve those objectives, and keeping all personal data secure. As defined by the GDPR, “personal data” is defined very broadly as “any information” that is related to a natural person. \
    
    If you prefer not to share your personal data with Media Cloud, you can still utilize the open source code without making a Media Cloud account.\
    
    This Privacy Policy will explain:\
    
    What personal data is collected through the Website and Platform and why;\
    
    Who we share the data with and why;\
    
    How you can control your personal data;\
    
    The security procedures in place to protect the misuse of personal data;

    And what happens when the Privacy Policy changes.\

    Data Collection and Use \

    PERSONAL DATA YOU PROVIDE\

    Media Cloud collects the name, email address, and additional notes about your profession and/or research interests you provide when you register for an account on the Platform. We use this information to set up your account so that you can access and use the Platform. We also use this information to better understand our audience and improve the Platform performance. When you register, we rely on your implicit consent to store that information until you close your account. You may withdraw this consent at any time by closing your account, which you can do on your profile page.\
    
    Media Cloud also collects aggregate data about the queries that users run (e.g. which media sources are utilized most) in order to continuously improve our set of sources. As system administrators, Media Cloud has the ability to view all the topics that you create (including topics that have not been made public) in order to fix system bugs, improve our topic creation process, and understand how the Platform is being used. When you close your account, all queries you have saved on your account, except public topics, are also deleted. Public topics are retained because other users may be using them.\
    
    Media Cloud also obtains information when you contact or email us directly. In these cases, we will use the information only to respond to you regarding the reason you contacted us and to aggregate user data for quality improvement. \
    
    From time to time, Media Cloud will request personal data from Platform users via surveys. Participation in these surveys is completely voluntary and you may choose whether or not to participate and therefore disclose this information. We may request contact information (such as name and email address) and demographic information (such as profession, affiliation or country). Contact information will be used only for follow up to the survey if you consent to such follow up. Survey results will be used to improve the use of the Platform and for our funders to understand how the Platform is performing. \
    
    If any of the information collected through the Platform or our surveys will be used for research (i.e. more than administrative tasks), we will also follow the policies and protocols required by MIT’s Committee on the Use of Humans as Experimental Subjects (COUHES), including applying for a review and approval of such study.\
    \

    PERSONAL DATA COLLECTED AUTOMATICALLY \

    To improve your experience on our Website and Platform, we may use 'cookies'. Cookies are an industry standard, and most major websites use them. A cookie is a small text file that our site may place on your computer as a tool to remember who you are and your preferences.\
    
    On the Website, we use only the cookies necessary to deliver the Website content and maintain functionality of the Website. On the Platform, we use cookies necessary to Platform functionality and to keep you logged into your account and to remember your preferences throughout multiple browser sessions. You may refuse the use of cookies by selecting the appropriate settings on your browser, however, please note that if you do this you may not be able to use the full functionality of the Website or Platform.  \
    
    We do not track or save IP addresses and log files. Your IP address may show up temporarily in log files, but all log files are deleted on a monthly basis. \
    
    We honor Do Not Track signals and do not track, plant cookies or use advertising when a Do Not Track browser mechanism is in place. \
    
    Information Sharing\
    
    We do not share your name or email address with any third party outside of our organization, and we do not sell nor rent any collected information to anyone. \
    
    Media Cloud shares usage data (e.g. numbers of users and interactions with the platform), other information that is provided by users (e.g. their profession or research interests), and survey results on aggregate as necessary. We share only aggregate data, meaning identifying information like names and emails are removed. We share this data only with our funders (e.g. foundations that give us money to operate) and partners (e.g. people and organizations with whom we collaborate on research). The aggregate usage data is used by us and our funders to assess the performance of our tools.\
    \

    USE OF GOOGLE ANALYTICS\
    
    Media Cloud uses Google Analytics, a service which transmits website traffic data to Google servers in the United States. Google Analytics does not identify individual users or associate your IP address with any other data held by Google. We use reports provided by Google Analytics to help us understand website traffic and web page usage. \
    
    By using this website, you consent to the processing of data about you by Google in the manner described in Google's Privacy Policy (external site) and for the purposes set out above. You can opt out of Google Analytics if you disable or refuse the cookie, disable JavaScript, or use the opt-out service provided by Google (external site). \
    
    Your Access to and Control over Personal Data \
    
    Media Cloud respects any and all rights you may have regarding personal data collected about you. You may access and change your account information at any time on your account profile page. You can also exercise any of the following rights at any time by contacting us at support@mediacloud.org:\
    
    · opt out of any future contact from us at any time; \
    
    · see or access what data we have about you, if any;\
    
    · change or correct any data we have about you;\
    
    · have us delete any data we have about you;\
    
    · have us restrict our use of the data we have about you;\
    
    · receive your personal data that you have provided to us in commonly used and machine-readable format; or \
    
    · express any concern you have about our use of your data. \
    \
    
    Security \

    We take precautions to protect your personal data. When you submit personal data via the website, it is protected both online and offline.\
    
    Wherever we collect sensitive information, it is encrypted and transmitted to us in a secure way. You can verify this by looking for a lock icon in the address bar and looking for "https" at the beginning of the address of the web page.\
    \
    
    Offline, only employees who need the information to perform a specific task (for example, support service) are granted access to personal data. The computers/servers in which we store personal data are kept in a secure environment.\
    
    Changes to the Privacy Policy\
    
    We may revise and update these Privacy Policy from time to time. When we do so, we will post the revised Policy on this webpage and send an alert through the platform (e.g. through the “Recent Changes” alert function). If there are major changes to this Privacy Policy or in how Media Cloud will use your personal data, we will also email you directly to disclose the changes unless you have asked us not to.\
    \
    
    If you feel that we are not abiding by this privacy policy, you should contact us immediately or via email at support@mediacloud.org.`;
  return (
    <div className="privacy-policy">
      <TextField
        multiline
        fullWidth
        maxRows={20}
        label={messages.privacyPolicy}
        value={privacyText}
      />
    </div>
  );
};

export default
injectIntl(
  PrivacyPolicyContainer
);
