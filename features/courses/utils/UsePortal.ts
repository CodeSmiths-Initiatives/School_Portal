"use client";

import { useState, useMemo } from "react";
import { Course, CourseStatus, CourseType, Level, NavPage, Role } from "../types/course.types";
import { COURSES } from "./data";

export function usePortal() {
  const [activePage, setActivePage] = useState<NavPage>('courses-definitions');
  const [activeRole, setActiveRole] = useState<Role>('Lecturer');
  const [courses, setCourses] = useState<Course[]>(COURSES);
 
  // Filters for course definitions page
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CourseType | 'All Types'>('All Types');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'All Status'>('All Status');
  const [levelFilter, setLevelFilter] = useState<Level | 'All Levels'>('All Levels');
  const [activeLevel, setActiveLevel] = useState<Level | null>('400L');
 
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
 
  function addCourse(course: Omit<Course, 'id'>) {
    setCourses(prev => [...prev, { ...course, id: Date.now().toString() }]);
  }
 
  function updateCourseStatus(id: string, status: CourseStatus, note?: string) {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, status, approvalNote: note } : c));
  }

  function updateCourse(id: string, course: Omit<Course, 'id'>) {
    setCourses(prev => prev.map(c => c.id === id ? { ...course, id } : c));
  }
 
  function deleteCourse(id: string) {
    setCourses(prev => prev.filter(c => c.id !== id));
  }
 
  return {
    activePage, setActivePage,
    activeRole, setActiveRole,
    courses, filteredCourses, stats,
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    levelFilter, setLevelFilter,
    activeLevel, setActiveLevel,
    addCourse, updateCourse, updateCourseStatus, deleteCourse,
  };
}
 
