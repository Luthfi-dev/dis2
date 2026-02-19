'use client';
import { cn } from '../lib/utils';

type StepperProps = {
  steps: { title: string }[];
  currentStep: number;
};

export function FormStepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="mb-12 flex items-center justify-between sm:justify-start">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <li key={step.title} className={cn('relative', index !== steps.length - 1 ? 'flex-1 sm:pr-20' : '')}>
              <div className="absolute inset-0 top-4 -ml-px mt-0.5 h-0.5 w-full bg-border" aria-hidden="true"></div>
              {isCompleted ? (
                <>
                  <div className="absolute inset-0 top-4 -ml-px mt-0.5 h-0.5 w-full bg-primary" aria-hidden="true"></div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                    </svg>
                  </div>
                </>
              ) : isCurrent ? (
                <>
                  <div className="absolute inset-0 top-4 -ml-px mt-0.5 h-0.5 w-full bg-border" aria-hidden="true"></div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true"></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 top-4 -ml-px mt-0.5 h-0.5 w-full bg-border" aria-hidden="true"></div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background"></div>
                </>
              )}
              <div className={cn("absolute top-10 -translate-x-1/2 left-1/2 w-max text-center", !isCurrent && "hidden sm:block")}>
                  <p className={cn("text-sm", isCurrent ? "font-semibold text-primary" : "text-muted-foreground")}>{step.title}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
