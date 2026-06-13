"use client";

import { useEffect, useMemo, useState } from "react";
import {
	createCourse,
	createCourseAllocation,
	deleteCourse as deleteCourseRequest,
	deleteCourseAllocation,
	deleteTimetableSlot as deleteTimetableSlotRequest,
	loadCourseCatalogue,
	loadCourseTimetable,
	createTimetableSlot,
	updateCourse as updateCourseRequest,
	updateCourseAllocation,
	updateTimetableSlot as updateTimetableSlotRequest,
} from "@/features/courses/services/courseCatalogue.client";
import type {
	Course,
	CourseStatus,
	CourseType,
	Level,
	NavPage,
	Role,
	TimelineSlot,
} from "../types/course.types";

export function usePortal(collegeSlug: string) {
  const [activePage, setActivePage] = useState<NavPage>('courses-definitions');
  const [activeRole, setActiveRole] = useState<Role>('Lecturer');
  const [courses, setCourses] = useState<Course[]>([]);
  const [timelineSlots, setTimelineSlots] = useState<TimelineSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMutating, setIsMutating] = useState(false);
 
  // Filters for course definitions page
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CourseType | 'All Types'>('All Types');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'All Status'>('All Status');
  const [levelFilter, setLevelFilter] = useState<Level | 'All Levels'>('All Levels');
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
 
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'All Types' || c.type === typeFilter;
      const matchStatus = statusFilter === 'All Status' || c.status === statusFilter;
      const matchLevel = !activeLevel || c.levels.includes(activeLevel);
      return matchSearch && matchType && matchStatus && matchLevel;
    });
  }, [courses, searchQuery, typeFilter, statusFilter, activeLevel]);
 
  const stats = useMemo(() => ({
    core: courses.filter(c => c.type === 'Core').length,
    elective: courses.filter(c => c.type === 'Elective').length,
    required: courses.filter(c => c.type === 'Required').length,
    borrowed: courses.filter(c => c.type === 'Borrowed').length,
  }), [courses]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadCourseCatalogue(collegeSlug), loadCourseTimetable(collegeSlug)])
      .then(([payload, timetable]) => {
        if (!isMounted) return;
        setCourses(payload.courses);
        setTimelineSlots(timetable.slots);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load course data.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [collegeSlug]);

  async function addCourse(course: Omit<Course, 'id'>) {
    setIsMutating(true);
    setError("");

    try {
      const result = await createCourse(collegeSlug, course);
      setCourses(prev => [...prev, result.course]);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create course.");
    } finally {
      setIsMutating(false);
    }
  }
 
  async function updateCourseStatus(id: string, status: CourseStatus, note?: string) {
    const currentCourse = courses.find((course) => course.id === id);

    if (!currentCourse) return;

    await updateCourse(id, { ...currentCourse, status, approvalNote: note });
  }

  async function updateCourse(id: string, course: Omit<Course, 'id'>) {
    setIsMutating(true);
    setError("");

    try {
      const result = await updateCourseRequest(collegeSlug, id, course);
      setCourses(prev => prev.map(c => c.id === id ? result.course : c));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to update course.");
    } finally {
      setIsMutating(false);
    }
  }
 
  async function deleteCourse(id: string) {
    setIsMutating(true);
    setError("");

    try {
      await deleteCourseRequest(collegeSlug, id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to delete course.");
    } finally {
      setIsMutating(false);
    }
  }

  async function addTimetableSlot(slot: Omit<TimelineSlot, "id">) {
    setIsMutating(true);
    setError("");

    try {
      const result = await createTimetableSlot(collegeSlug, slot);
      setTimelineSlots(prev => [...prev, result.slot]);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create timetable slot.");
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function updateTimetableSlot(id: string, slot: Omit<TimelineSlot, "id">) {
    setIsMutating(true);
    setError("");

    try {
      const result = await updateTimetableSlotRequest(collegeSlug, id, slot);
      setTimelineSlots(prev => prev.map(item => item.id === id ? result.slot : item));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to update timetable slot.");
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteTimetableSlot(id: string) {
    setIsMutating(true);
    setError("");

    try {
      await deleteTimetableSlotRequest(collegeSlug, id);
      setTimelineSlots(prev => prev.filter(item => item.id !== id));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to delete timetable slot.");
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  function replaceCourses(nextCourses: Course[]) {
    setCourses(prev => {
      const byId = new Map(prev.map(course => [course.id, course]));

      nextCourses.forEach(course => {
        byId.set(course.id, course);
      });

      return Array.from(byId.values());
    });
  }

  async function addAllocation(courseId: string, level: Level) {
    setIsMutating(true);
    setError("");

    try {
      const result = await createCourseAllocation(collegeSlug, { courseId, level });
      replaceCourses([result.course]);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create course allocation.");
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function updateAllocation(
    courseId: string,
    level: Level,
    nextCourseId: string,
    nextLevel: Level,
  ) {
    setIsMutating(true);
    setError("");

    try {
      const result = await updateCourseAllocation(collegeSlug, {
        courseId,
        level,
        nextCourseId,
        nextLevel,
      });
      replaceCourses(result.courses);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to update course allocation.");
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function removeAllocation(courseId: string, level: Level) {
    setIsMutating(true);
    setError("");

    try {
      const result = await deleteCourseAllocation(collegeSlug, { courseId, level });
      replaceCourses([result.course]);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to delete course allocation.");
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }
 
  return {
    activePage, setActivePage,
    activeRole, setActiveRole,
    isLoading, error, isMutating,
    courses, filteredCourses, timelineSlots, stats,
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    levelFilter, setLevelFilter,
    activeLevel, setActiveLevel,
    addCourse, updateCourse, updateCourseStatus, deleteCourse,
    addTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
    addAllocation, updateAllocation, removeAllocation,
  };
}
 
