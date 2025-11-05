'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Stethoscope,
  Calendar,
  FileText,
  Video,
  LogOut,
  Settings,
  Users,
  Home,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { useAuth, useDoc, useFirestore, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';

const patientNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/dashboard/symptom-checker',
    label: 'Symptom Checker',
    icon: Stethoscope,
  },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/records', label: 'Health Records', icon: FileText },
  { href: '/dashboard/consultations', label: 'Consultations', icon: Video },
];

const doctorNavItems = [
    { href: '/dashboard/staff', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/staff/roster', label: 'Manage Roster', icon: Users },
    { href: '/dashboard/records', label: 'Patient Records', icon: FileText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);

  const patientDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'patients', user.uid) : null),
    [firestore, user]
  );
  const { data: patientData, isLoading: isPatientDataLoading } = useDoc(patientDocRef);

  const doctorDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'doctors', user.uid) : null),
    [firestore, user]
  );
  const { data: doctorData, isLoading: isDoctorDataLoading } = useDoc(doctorDocRef);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (isPatientDataLoading || isDoctorDataLoading) return;

    if (patientData) {
      setUserRole('patient');
      if (pathname.startsWith('/dashboard/staff')) {
        router.replace('/dashboard');
      }
    } else if (doctorData) {
      setUserRole('doctor');
      if (!pathname.startsWith('/dashboard/staff') && pathname !== '/dashboard' && !['/dashboard/appointments', '/dashboard/consultations', '/dashboard/records', '/dashboard/profile', '/dashboard/settings'].includes(pathname) ) {
         router.replace('/dashboard/staff');
      } else if (pathname === '/dashboard') {
        router.replace('/dashboard/staff');
      }
    }
  }, [patientData, doctorData, isPatientDataLoading, isDoctorDataLoading, router, pathname]);


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };
  
  const navItems = userRole === 'doctor' ? doctorNavItems : patientNavItems;
  const isLoading = isUserLoading || (user && !userRole && (isPatientDataLoading || isDoctorDataLoading));

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isSettingsActive = pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/profile');

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo isDashboard />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="flex-col gap-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Settings"
                isActive={isSettingsActive}
              >
                <Link href="/dashboard/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-8">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="font-headline text-xl font-bold">
              {navItems.find((item) => pathname.startsWith(item.href))?.label ||
                (isSettingsActive ? (pathname.startsWith('/dashboard/profile') ? 'Profile' : 'Settings') : 'MedConnect')}
            </h1>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
