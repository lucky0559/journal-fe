import { api } from '@/api';
import { createSocialApi } from './socialApi';

export const social = createSocialApi(api);
