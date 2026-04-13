export interface ClassroomDto {
  id: number
  officeId: number
  name: string
}

export interface GroupTypeDto {
  id: number
  name: string
  format: string
}

export interface GroupListItemDto {
  id: number
  name: string
  groupTypeId: number
  groupTypeName: string
  teacherId: number
  teacherName: string
  subjectId: number
  subjectName: string
  classroomId: number
  classroomName: string
  startTime: string
  endTime: string
  mon: boolean
  tue: boolean
  wed: boolean
  thu: boolean
  fri: boolean
  sat: boolean
  sun: boolean
  studentCount: number
}

export interface GroupMemberDto {
  id: number
  studentId: number
  studentName: string
}

export interface GroupDetailDto {
  id: number
  name: string
  groupTypeId: number
  groupTypeName: string
  teacherId: number
  teacherName: string
  subjectId: number
  subjectName: string
  classroomId: number
  classroomName: string
  officeId: number
  officeName: string
  startTime: string
  endTime: string
  mon: boolean
  tue: boolean
  wed: boolean
  thu: boolean
  fri: boolean
  sat: boolean
  sun: boolean
  members: GroupMemberDto[]
}

export interface GroupCreateRequest {
  name: string
  groupTypeId: number
  subjectId: number
  teacherId: number
  officeId: number
  classroomId: number
  startTime: string
  durationMinutes: number
  mon: boolean
  tue: boolean
  wed: boolean
  thu: boolean
  fri: boolean
  sat: boolean
  sun: boolean
}

export interface GroupUpdateRequest {
  name: string
  groupTypeId: number
  subjectId: number
  teacherId: number
  officeId: number
  classroomId: number
  startTime: string
  durationMinutes: number
  mon: boolean
  tue: boolean
  wed: boolean
  thu: boolean
  fri: boolean
  sat: boolean
  sun: boolean
}
