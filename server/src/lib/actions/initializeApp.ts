import User from '@/lib/models/user';
import { hashPassword } from '@/utils/encryption/encryption';
import logger from '@/utils/logger';

let isFunctionExecuted = false;

export async function initializeApp() {
    if (isFunctionExecuted) {
        return;
    }
    isFunctionExecuted = true;
    if (process.env.NODE_ENV === 'development') {
        try {
            const firstUser = await User.findOldestUser();
            if (firstUser) {
                const newPassword = 'Abcd1234!';
                const hashedPassword = hashPassword(newPassword);
                await User.updatePassword(firstUser.email, hashedPassword);
                logger.info(`
                    
                

    :::::::::  :::::::::: :::     ::: :::::::::: :::        ::::::::  :::::::::  ::::    ::::  :::::::::: ::::    ::: :::::::::::      ::::    ::::   ::::::::  :::::::::  
    :+:    :+: :+:        :+:     :+: :+:        :+:       :+:    :+: :+:    :+: +:+:+: :+:+:+ :+:        :+:+:   :+:     :+:          +:+:+: :+:+:+ :+:    :+: :+:    :+: 
    +:+    +:+ +:+        +:+     +:+ +:+        +:+       +:+    +:+ +:+    +:+ +:+ +:+:+ +:+ +:+        :+:+:+  +:+     +:+          +:+ +:+:+ +:+ +:+    +:+ +:+    +:+ 
    +#+    +:+ +#++:++#   +#+     +:+ +#++:++#   +#+       +#+    +:+ +#++:++#+  +#+  +:+  +#+ +#++:++#   +#+ +:+ +#+     +#+          +#+  +:+  +#+ +#+    +:+ +#+    +:+ 
    +#+    +#+ +#+         +#+   +#+  +#+        +#+       +#+    +#+ +#+        +#+       +#+ +#+        +#+  +#+#+#     +#+          +#+       +#+ +#+    +#+ +#+    +#+ 
    #+#    #+# #+#          #+#+#+#   #+#        #+#       #+#    #+# #+#        #+#       #+# #+#        #+#   #+#+#     #+#          #+#       #+# #+#    #+# #+#    #+# 
    #########  ##########     ###     ########## ########## ########  ###        ###       ### ########## ###    ####     ###          ###       ###  ########  #########  


            `);
                logger.info('*************************************************************');
                logger.info(`********                                             ********`);
                logger.info(`******** User Email is -> [ ${firstUser.email} ]  ********`);
                logger.info(`********                                             ********`);
                logger.info(`********       Password is -> [ ${newPassword} ]          ********`);
                logger.info(`********                                             ********`);
                logger.info('*************************************************************');

            } else {
                logger.info('No users found. Skipping password update.');
            }
        } catch (error) {
            logger.error('Error initializing app:', error);
        }
    }
}
