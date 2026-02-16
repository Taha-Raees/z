import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'

export type ObjectiveQuestionType = 'mcq' | 'true_false' | 'short_answer' | 'open'

export type QuestionResponseInputProps = {
  id: string
  index: number
  prompt: string
  type?: string
  options?: string[]
  value: string | number | boolean | null
  onChange: (value: string | number | boolean | null) => void
  compact?: boolean
}

function normalizeQuestionType(raw: string | undefined): ObjectiveQuestionType {
  const normalized = (raw || '').toLowerCase()
  if (normalized === 'mcq' || normalized === 'multiple_choice') return 'mcq'
  if (normalized === 'true_false' || normalized === 'boolean') return 'true_false'
  if (normalized === 'short_answer') return 'short_answer'
  return 'open'
}

export function QuestionResponseInput({
  id,
  index,
  prompt,
  type,
  options,
  value,
  onChange,
  compact = false,
}: QuestionResponseInputProps) {
  const questionType = normalizeQuestionType(type)

  return (
    <fieldset className="surface-muted p-3" aria-label={`Question ${index + 1}`}>
      <legend className="sr-only">{`Question ${index + 1}`}</legend>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {`Q${index + 1} • ${questionType.replace('_', ' ')}`}
      </p>
      <p className={cn('mt-1 text-sm text-foreground/95', compact && 'text-xs')}>{prompt}</p>

      {questionType === 'mcq' && Array.isArray(options) && options.length > 0 ? (
        <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label={`Question ${index + 1} options`}>
          {options.map((option, optionIndex) => {
            const active = value === optionIndex
            return (
              <button
                key={`${id}-option-${optionIndex}`}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(optionIndex)}
                className={cn(
                  'w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border/70 bg-background text-foreground/90 hover:bg-muted/40'
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      ) : null}

      {questionType === 'true_false' ? (
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" variant={value === true ? 'primary' : 'secondary'} onClick={() => onChange(true)}>
            True
          </Button>
          <Button
            type="button"
            size="sm"
            variant={value === false ? 'destructive' : 'secondary'}
            onClick={() => onChange(false)}
          >
            False
          </Button>
        </div>
      ) : null}

      {questionType !== 'mcq' && questionType !== 'true_false' ? (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          rows={compact ? 2 : 3}
          className={cn('mt-2 text-xs', compact ? 'min-h-[64px]' : 'min-h-[80px]')}
          placeholder="Type your answer"
        />
      ) : null}
    </fieldset>
  )
}
