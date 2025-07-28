import { Teacher, TeacherWithUser } from "@shared/schema";
import { haversineDistance, getDistrictCoordinates } from "./distance";

export interface MatchResult {
  teacher: TeacherWithUser;
  matchType: 'perfect' | 'nearby';
  distance: number;
  score: number;
}

/**
 * Find matches for a teacher based on their preferences
 */
export function findMatches(
  currentTeacher: TeacherWithUser,
  allTeachers: TeacherWithUser[]
): MatchResult[] {
  const matches: MatchResult[] = [];
  
  for (const teacher of allTeachers) {
    if (teacher.id === currentTeacher.id || !teacher.isActive) continue;
    
    // Check for perfect mutual match
    const isPerfectMatch = checkPerfectMatch(currentTeacher, teacher);
    if (isPerfectMatch) {
      const distance = calculateDistance(currentTeacher, teacher);
      matches.push({
        teacher,
        matchType: 'perfect',
        distance,
        score: 100,
      });
      continue;
    }
    
    // Check for nearby match
    const nearbyMatch = checkNearbyMatch(currentTeacher, teacher);
    if (nearbyMatch) {
      matches.push({
        teacher,
        matchType: 'nearby',
        distance: nearbyMatch.distance,
        score: nearbyMatch.score,
      });
    }
  }
  
  // Sort by match type (perfect first) then by distance
  return matches.sort((a, b) => {
    if (a.matchType === 'perfect' && b.matchType !== 'perfect') return -1;
    if (a.matchType !== 'perfect' && b.matchType === 'perfect') return 1;
    return a.distance - b.distance;
  });
}

function checkPerfectMatch(teacher1: TeacherWithUser, teacher2: TeacherWithUser): boolean {
  // Perfect match: teacher1 wants to go to teacher2's district AND teacher2 wants to go to teacher1's district
  const teacher1WantsTeacher2District = teacher1.preferredDistricts.includes(teacher2.currentDistrict);
  const teacher2WantsTeacher1District = teacher2.preferredDistricts.includes(teacher1.currentDistrict);
  
  // Both teachers must teach the same grade level for mutual transfer eligibility
  const sameGradeLevel = teacher1.gradeLevel === teacher2.gradeLevel;
  
  return teacher1WantsTeacher2District && teacher2WantsTeacher1District && sameGradeLevel;
}

function checkNearbyMatch(
  currentTeacher: TeacherWithUser,
  otherTeacher: TeacherWithUser
): { distance: number; score: number } | null {
  // Both teachers must teach the same grade level for transfer eligibility
  if (currentTeacher.gradeLevel !== otherTeacher.gradeLevel) {
    return null;
  }
  
  // Check if the other teacher is closer to current teacher's home than current teacher's current location
  const currentTeacherCurrentToHome = calculateDistanceToHome(currentTeacher);
  const otherTeacherToCurrentHome = calculateDistanceFromTeacherToHome(otherTeacher, currentTeacher);
  
  if (otherTeacherToCurrentHome < currentTeacherCurrentToHome && otherTeacherToCurrentHome <= currentTeacher.maxDistance!) {
    const score = Math.max(0, 100 - Math.floor(otherTeacherToCurrentHome / 10));
    return { distance: otherTeacherToCurrentHome, score };
  }
  
  return null;
}

function calculateDistance(teacher1: TeacherWithUser, teacher2: TeacherWithUser): number {
  if (teacher1.currentLatitude && teacher1.currentLongitude && 
      teacher2.currentLatitude && teacher2.currentLongitude) {
    return haversineDistance(
      parseFloat(teacher1.currentLatitude),
      parseFloat(teacher1.currentLongitude),
      parseFloat(teacher2.currentLatitude),
      parseFloat(teacher2.currentLongitude)
    );
  }
  
  // Fallback to district coordinates
  const coords1 = getDistrictCoordinates(teacher1.currentDistrict);
  const coords2 = getDistrictCoordinates(teacher2.currentDistrict);
  
  if (coords1 && coords2) {
    return haversineDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
  }
  
  return 0;
}

function calculateDistanceToHome(teacher: TeacherWithUser): number {
  if (teacher.currentLatitude && teacher.currentLongitude && 
      teacher.homeLatitude && teacher.homeLongitude) {
    return haversineDistance(
      parseFloat(teacher.currentLatitude),
      parseFloat(teacher.currentLongitude),
      parseFloat(teacher.homeLatitude),
      parseFloat(teacher.homeLongitude)
    );
  }
  
  // Fallback to district coordinates
  const currentCoords = getDistrictCoordinates(teacher.currentDistrict);
  const homeCoords = getDistrictCoordinates(teacher.homeDistrict);
  
  if (currentCoords && homeCoords) {
    return haversineDistance(currentCoords.lat, currentCoords.lng, homeCoords.lat, homeCoords.lng);
  }
  
  return 0;
}

function calculateDistanceFromTeacherToHome(teacher: TeacherWithUser, homeTeacher: TeacherWithUser): number {
  // Use precise school coordinates if available
  let teacherLat, teacherLng, homeLat, homeLng;
  
  // Teacher's current location (prefer school coordinates, then current coordinates, then district)
  if (teacher.currentSchoolLatitude && teacher.currentSchoolLongitude) {
    teacherLat = parseFloat(teacher.currentSchoolLatitude);
    teacherLng = parseFloat(teacher.currentSchoolLongitude);
  } else if (teacher.currentLatitude && teacher.currentLongitude) {
    teacherLat = parseFloat(teacher.currentLatitude);
    teacherLng = parseFloat(teacher.currentLongitude);
  } else {
    const teacherCoords = getDistrictCoordinates(teacher.currentDistrict);
    if (teacherCoords) {
      teacherLat = teacherCoords.lat;
      teacherLng = teacherCoords.lng;
    }
  }
  
  // Home teacher's location (prefer home coordinates, then preferred location, then district)
  if (homeTeacher.homeLatitude && homeTeacher.homeLongitude) {
    homeLat = parseFloat(homeTeacher.homeLatitude);
    homeLng = parseFloat(homeTeacher.homeLongitude);
  } else if (homeTeacher.preferredLocationLatitude && homeTeacher.preferredLocationLongitude) {
    homeLat = parseFloat(homeTeacher.preferredLocationLatitude);
    homeLng = parseFloat(homeTeacher.preferredLocationLongitude);
  } else {
    const homeCoords = getDistrictCoordinates(homeTeacher.homeDistrict);
    if (homeCoords) {
      homeLat = homeCoords.lat;
      homeLng = homeCoords.lng;
    }
  }
  
  if (teacherLat && teacherLng && homeLat && homeLng) {
    return haversineDistance(teacherLat, teacherLng, homeLat, homeLng);
  }
  
  return 0;
}
