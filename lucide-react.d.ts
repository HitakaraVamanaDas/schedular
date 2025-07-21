
// lucide-react.d.ts
import { LucideProps, ForwardRefExoticComponent, SVGProps } from 'lucide-react';

declare module 'lucide-react' {
  export const Home: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  export const Tags: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  export const CalendarDays: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}
