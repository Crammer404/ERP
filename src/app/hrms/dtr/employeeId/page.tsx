import { Card, CardContent } from '@/components/ui/card';
import { EmployeeIdCard } from './components/employee-id';

export default function EmployeeIdPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-md">
        <CardContent>
          <EmployeeIdCard />
        </CardContent>
      </div>
    </div>
  );
}
