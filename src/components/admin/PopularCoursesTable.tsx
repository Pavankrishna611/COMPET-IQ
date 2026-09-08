'use client';

import React from 'react';
import { PopularCourseItem } from '@/data/trainingAnalytics';
import { Badge } from '@/components/ui/Badge';
import { Award, BookOpen, Clock, Users } from 'lucide-react';

interface PopularCoursesTableProps {
  courses: PopularCourseItem[];
}

export function PopularCoursesTable({ courses }: PopularCoursesTableProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Most Popular &amp; High-Enrollment Courses
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Ranked catalog offerings by official participation and completion performance
          </p>
        </div>
        <span className="text-xs font-mono text-text-muted">
          Top {courses.length} MoSPI &amp; iGOT Courses
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-light text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 w-12 text-center">Rank</th>
              <th className="py-2.5 px-3">Course &amp; Provider</th>
              <th className="py-2.5 px-3">Domain</th>
              <th className="py-2.5 px-3">Enrollments</th>
              <th className="py-2.5 px-3">Completion Rate</th>
              <th className="py-2.5 px-3">Avg Assessment Score</th>
              <th className="py-2.5 px-3 text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {courses.map((course) => (
              <tr key={course.courseName} className="hover:bg-primary-light/30 transition-colors">
                {/* Rank */}
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold font-mono text-xs border border-primary/20">
                    {course.rank}
                  </span>
                </td>

                {/* Course & Provider */}
                <td className="py-3 px-3">
                  <div className="font-bold text-text-primary">
                    {course.courseName}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {course.provider}
                  </div>
                </td>

                {/* Domain */}
                <td className="py-3 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-raised border border-border text-text-secondary">
                    {course.domain}
                  </span>
                </td>

                {/* Enrollments */}
                <td className="py-3 px-3 font-mono font-semibold text-text-primary">
                  {course.enrollments.toLocaleString()}
                </td>

                {/* Completion */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-border-light rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal"
                        style={{ width: `${course.completionRate}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-teal">
                      {course.completionRate}%
                    </span>
                  </div>
                </td>

                {/* Avg Score */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-border-light rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${course.averageScore}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-text-primary">
                      {course.averageScore}%
                    </span>
                  </div>
                </td>

                {/* Duration */}
                <td className="py-3 px-3 text-right font-mono text-text-muted">
                  {course.duration}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
