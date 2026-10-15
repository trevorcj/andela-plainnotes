export const dynamic='force-dynamic';
import {AuthForm} from '@/components/auth-form';import {requireUser} from '@/lib/auth';export default async function Page(){await requireUser();return <AuthForm mode="update" configured/>}
