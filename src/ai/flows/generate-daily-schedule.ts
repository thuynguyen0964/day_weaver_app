// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview AI agent that generates an optimized daily schedule based on user inputs.
 *
 * - generateDailySchedule - A function that generates an optimized daily schedule.
 * - GenerateDailyScheduleInput - The input type for the generateDailySchedule function.
 * - GenerateDailyScheduleOutput - The return type for the generateDailySchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  task: z.string().describe('The name of the task.'),
  deadline: z.string().describe('The deadline for the task (e.g., YYYY-MM-DD HH:mm).'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the task.'),
  durationEstimate: z.string().optional().describe('Estimated duration of the task (e.g., 1h, 30m). If not provided, the AI will estimate.'),
});

const GenerateDailyScheduleInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of tasks, deadlines, and priorities.'),
});

export type GenerateDailyScheduleInput = z.infer<typeof GenerateDailyScheduleInputSchema>;

const ScheduledTaskSchema = TaskSchema.extend({
  startTime: z.string().describe('Suggested start time for the task (e.g., HH:mm).'),
  endTime: z.string().describe('Suggested end time for the task (e.g., HH:mm).'),
});

const GenerateDailyScheduleOutputSchema = z.object({
  schedule: z.array(ScheduledTaskSchema).describe('An optimized daily schedule.'),
  notes: z.string().optional().describe('Any notes or suggestions for the user.'),
});

export type GenerateDailyScheduleOutput = z.infer<typeof GenerateDailyScheduleOutputSchema>;

export async function generateDailySchedule(input: GenerateDailyScheduleInput): Promise<GenerateDailyScheduleOutput> {
  return generateDailyScheduleFlow(input);
}

const generateDailySchedulePrompt = ai.definePrompt({
  name: 'generateDailySchedulePrompt',
  input: {schema: GenerateDailyScheduleInputSchema},
  output: {schema: GenerateDailyScheduleOutputSchema},
  prompt: `You are a personal AI assistant that specializes in generating optimized daily schedules.

  Given a list of tasks, deadlines, and priorities, you will generate a schedule that maximizes productivity and ensures all deadlines are met.

  Consider the priority of each task when creating the schedule. High-priority tasks should be scheduled first, followed by medium-priority tasks, and then low-priority tasks.

  Attempt to infer duration of tasks if not provided, and include it in your notes.

  Here are the tasks, deadlines, and priorities:

  {{#each tasks}}
  - Task: {{task}}, Deadline: {{deadline}}, Priority: {{priority}}{{#if durationEstimate}}, Duration Estimate: {{durationEstimate}}{{/if}}
  {{/each}}

  Please generate an optimized daily schedule:
  `,
});

const generateDailyScheduleFlow = ai.defineFlow(
  {
    name: 'generateDailyScheduleFlow',
    inputSchema: GenerateDailyScheduleInputSchema,
    outputSchema: GenerateDailyScheduleOutputSchema,
  },
  async input => {
    const {output} = await generateDailySchedulePrompt(input);
    return output!;
  }
);
