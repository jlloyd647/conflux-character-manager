import { create } from 'zustand'
import { getAllBloodlines } from '../services/bloodlineService'
import { getAllSkills } from '../services/skillService'

/**
 * @typedef {import('../services/skillService').Skill} Skill
 * @typedef {import('../services/bloodlineService').Bloodline} Bloodline
 */

export const useReferenceDataStore = create((set, get) => ({
  skills: [],
  skillsLoading: false,
  skillsError: null,
  bloodlines: [],
  bloodlinesLoading: false,
  bloodlinesError: null,

  loadSkills: async () => {
    set({ skillsLoading: true, skillsError: null })

    try {
      const skills = await getAllSkills()
      set({ skills, skillsLoading: false })
      return skills
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load skills'
      set({ skillsError: message, skillsLoading: false })
      throw error
    }
  },

  setSkills: (skills) => set({ skills }),

  upsertSkill: (skill) =>
    set((state) => {
      const index = state.skills.findIndex((entry) => entry.id === skill.id)

      if (index >= 0) {
        const skills = [...state.skills]
        skills[index] = skill
        return { skills }
      }

      return {
        skills: [...state.skills, skill].sort(
          (left, right) => left.skillID - right.skillID,
        ),
      }
    }),

  getSkillById: (id) => get().skills.find((skill) => skill.id === id) ?? null,

  getSkillBySkillID: (skillID) =>
    get().skills.find((skill) => skill.skillID === Number(skillID)) ?? null,

  clearSkills: () => set({ skills: [], skillsLoading: false, skillsError: null }),

  loadBloodlines: async () => {
    set({ bloodlinesLoading: true, bloodlinesError: null })

    try {
      const bloodlines = await getAllBloodlines()
      set({ bloodlines, bloodlinesLoading: false })
      return bloodlines
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load bloodlines'
      set({ bloodlinesError: message, bloodlinesLoading: false })
      throw error
    }
  },

  setBloodlines: (bloodlines) => set({ bloodlines }),

  upsertBloodline: (bloodline) =>
    set((state) => {
      const index = state.bloodlines.findIndex(
        (entry) => entry.bloodlineID === bloodline.bloodlineID,
      )

      if (index >= 0) {
        const bloodlines = [...state.bloodlines]
        bloodlines[index] = bloodline
        return { bloodlines }
      }

      return {
        bloodlines: [...state.bloodlines, bloodline].sort(
          (left, right) => left.bloodlineID - right.bloodlineID,
        ),
      }
    }),

  getBloodlineByBloodlineID: (bloodlineID) =>
    get().bloodlines.find((bloodline) => bloodline.bloodlineID === Number(bloodlineID)) ??
    null,

  clearBloodlines: () =>
    set({ bloodlines: [], bloodlinesLoading: false, bloodlinesError: null }),
}))
