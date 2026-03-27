export type AppRole =
  | 'ADMIN'
  | 'COORDINATOR'
  | 'PRESIDENT'
  | 'VP'
  | 'MEMBER'
  | 'GUEST';

export const getDefaultRouteForRole = (role?: AppRole | null) => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'COORDINATOR':
      return '/coordinator';
    case 'PRESIDENT':
    case 'VP':
      return '/manage-club';
    case 'MEMBER':
    case 'GUEST':
    default:
      return '/dashboard';
  }
};
