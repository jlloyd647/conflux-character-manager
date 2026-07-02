import { create } from 'zustand'
import { getAllBanes } from '../services/baneService'
import { getAllBloodlines } from '../services/bloodlineService'
import { getAllCurses } from '../services/curseService'
import { getAllGifts } from '../services/giftService'
import { getAllKingroups } from '../services/kingroupService'
import { getAllFormats } from '../services/formatService'
import { getAllLores } from '../services/loreService'
import { getAllPrereqs } from '../services/prereqService'
import { getAllRowStatuses } from '../services/rowStatusService'
import { getAllSkills } from '../services/skillService'
import { getAllStatProgressions } from '../services/statProgressionService'
import { getAllStats } from '../services/statDefinitionService'
import { getAllTalents } from '../services/talentService'

/**
 * @typedef {import('../services/skillService').Skill} Skill
 * @typedef {import('../services/bloodlineService').Bloodline} Bloodline
 * @typedef {import('../services/kingroupService').Kingroup} Kingroup
 * @typedef {import('../services/baneService').Bane} Bane
 * @typedef {import('../services/giftService').Gift} Gift
 * @typedef {import('../services/curseService').Curse} Curse
 * @typedef {import('../services/statProgressionService').StatProgression} StatProgression
 * @typedef {import('../services/statDefinitionService').Stat} Stat
 * @typedef {import('../services/talentService').Talent} Talent
 * @typedef {import('../services/prereqService').Prereq} Prereq
 * @typedef {import('../services/rowStatusService').RowStatus} RowStatus
 * @typedef {import('../services/loreService').Lore} Lore
 * @typedef {import('../services/formatService').Format} Format
 */

export const useReferenceDataStore = create((set, get) => ({
  skills: [],
  skillsLoading: false,
  skillsError: null,
  skillsLoaded: false,
  bloodlines: [],
  bloodlinesLoading: false,
  bloodlinesError: null,
  kingroups: [],
  kingroupsLoading: false,
  kingroupsError: null,
  banes: [],
  banesLoading: false,
  banesError: null,
  gifts: [],
  giftsLoading: false,
  giftsError: null,
  curses: [],
  cursesLoading: false,
  cursesError: null,
  statProgressions: [],
  statProgressionsLoading: false,
  statProgressionsError: null,
  stats: [],
  statsLoading: false,
  statsError: null,
  talents: [],
  talentsLoading: false,
  talentsError: null,
  talentsLoaded: false,
  prereqs: [],
  prereqsLoading: false,
  prereqsError: null,
  prereqsLoaded: false,
  rowStatuses: [],
  rowStatusesLoading: false,
  rowStatusesError: null,
  rowStatusesLoaded: false,
  lores: [],
  loresLoading: false,
  loresError: null,
  loresLoaded: false,
  formats: [],
  formatsLoading: false,
  formatsError: null,
  formatsLoaded: false,

  loadSkills: async () => {
    const { skillsLoading, skillsLoaded, skills } = get()

    if (skillsLoading) {
      return skills
    }

    if (skillsLoaded) {
      return skills
    }

    set({ skillsLoading: true, skillsError: null })

    try {
      const nextSkills = await getAllSkills()
      set({ skills: nextSkills, skillsLoading: false, skillsLoaded: true })
      return nextSkills
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load skills'
      set({ skillsError: message, skillsLoading: false, skillsLoaded: true })
      throw error
    }
  },

  setSkills: (skills) => set({ skills }),

  upsertSkill: (skill) =>
    set((state) => {
      const index = state.skills.findIndex((entry) => entry.skillID === skill.skillID)

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

  getSkillBySkillID: (skillID) =>
    get().skills.find((skill) => skill.skillID === Number(skillID)) ?? null,

  clearSkills: () =>
    set({ skills: [], skillsLoading: false, skillsError: null, skillsLoaded: false }),

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

  loadKingroups: async () => {
    set({ kingroupsLoading: true, kingroupsError: null })

    try {
      const kingroups = await getAllKingroups()
      set({ kingroups, kingroupsLoading: false })
      return kingroups
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load kingroups'
      set({ kingroupsError: message, kingroupsLoading: false })
      throw error
    }
  },

  setKingroups: (kingroups) => set({ kingroups }),

  upsertKingroup: (kingroup) =>
    set((state) => {
      const index = state.kingroups.findIndex(
        (entry) => entry.kingroupID === kingroup.kingroupID,
      )

      if (index >= 0) {
        const kingroups = [...state.kingroups]
        kingroups[index] = kingroup
        return { kingroups }
      }

      return {
        kingroups: [...state.kingroups, kingroup].sort(
          (left, right) => left.kingroupID - right.kingroupID,
        ),
      }
    }),

  getKingroupByKingroupID: (kingroupID) =>
    get().kingroups.find((kingroup) => kingroup.kingroupID === Number(kingroupID)) ??
    null,

  getKingroupsByBloodlineID: (bloodlineID) =>
    get().kingroups.filter((kingroup) => kingroup.bloodlineID === Number(bloodlineID)),

  clearKingroups: () =>
    set({ kingroups: [], kingroupsLoading: false, kingroupsError: null }),

  loadBanes: async () => {
    set({ banesLoading: true, banesError: null })

    try {
      const banes = await getAllBanes()
      set({ banes, banesLoading: false })
      return banes
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load banes'
      set({ banesError: message, banesLoading: false })
      throw error
    }
  },

  setBanes: (banes) => set({ banes }),

  upsertBane: (bane) =>
    set((state) => {
      const index = state.banes.findIndex((entry) => entry.baneID === bane.baneID)

      if (index >= 0) {
        const banes = [...state.banes]
        banes[index] = bane
        return { banes }
      }

      return {
        banes: [...state.banes, bane].sort((left, right) => left.baneID - right.baneID),
      }
    }),

  getBaneByBaneID: (baneID) =>
    get().banes.find((bane) => bane.baneID === Number(baneID)) ?? null,

  getBanesByBloodlineID: (bloodlineID) =>
    get().banes.filter((bane) => bane.bloodlineID === Number(bloodlineID)),

  clearBanes: () => set({ banes: [], banesLoading: false, banesError: null }),

  loadGifts: async () => {
    set({ giftsLoading: true, giftsError: null })

    try {
      const gifts = await getAllGifts()
      set({ gifts, giftsLoading: false })
      return gifts
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load gifts'
      set({ giftsError: message, giftsLoading: false })
      throw error
    }
  },

  setGifts: (gifts) => set({ gifts }),

  upsertGift: (gift) =>
    set((state) => {
      const index = state.gifts.findIndex((entry) => entry.giftID === gift.giftID)

      if (index >= 0) {
        const gifts = [...state.gifts]
        gifts[index] = gift
        return { gifts }
      }

      return {
        gifts: [...state.gifts, gift].sort((left, right) => left.giftID - right.giftID),
      }
    }),

  getGiftByGiftID: (giftID) =>
    get().gifts.find((gift) => gift.giftID === Number(giftID)) ?? null,

  getGiftsByBloodlineID: (bloodlineID) =>
    get().gifts.filter((gift) => gift.bloodlineID === Number(bloodlineID)),

  clearGifts: () => set({ gifts: [], giftsLoading: false, giftsError: null }),

  loadCurses: async () => {
    set({ cursesLoading: true, cursesError: null })

    try {
      const curses = await getAllCurses()
      set({ curses, cursesLoading: false })
      return curses
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load curses'
      set({ cursesError: message, cursesLoading: false })
      throw error
    }
  },

  setCurses: (curses) => set({ curses }),

  upsertCurse: (curse) =>
    set((state) => {
      const index = state.curses.findIndex((entry) => entry.curseID === curse.curseID)

      if (index >= 0) {
        const curses = [...state.curses]
        curses[index] = curse
        return { curses }
      }

      return {
        curses: [...state.curses, curse].sort(
          (left, right) => left.curseID - right.curseID,
        ),
      }
    }),

  getCurseByCurseID: (curseID) =>
    get().curses.find((curse) => curse.curseID === Number(curseID)) ?? null,

  getCursesByBloodlineID: (bloodlineID) =>
    get().curses.filter((curse) => curse.bloodlineID === Number(bloodlineID)),

  clearCurses: () => set({ curses: [], cursesLoading: false, cursesError: null }),

  loadStatProgressions: async () => {
    set({ statProgressionsLoading: true, statProgressionsError: null })

    try {
      const statProgressions = await getAllStatProgressions()
      set({ statProgressions, statProgressionsLoading: false })
      return statProgressions
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load stat progressions'
      set({ statProgressionsError: message, statProgressionsLoading: false })
      throw error
    }
  },

  setStatProgressions: (statProgressions) => set({ statProgressions }),

  upsertStatProgression: (statProgression) =>
    set((state) => {
      const index = state.statProgressions.findIndex(
        (entry) => entry.progressionID === statProgression.progressionID,
      )

      if (index >= 0) {
        const statProgressions = [...state.statProgressions]
        statProgressions[index] = statProgression
        return { statProgressions }
      }

      return {
        statProgressions: [...state.statProgressions, statProgression].sort(
          (left, right) => left.progressionID - right.progressionID,
        ),
      }
    }),

  getStatProgressionByProgressionID: (progressionID) =>
    get().statProgressions.find(
      (progression) => progression.progressionID === Number(progressionID),
    ) ?? null,

  getStatProgressionsByStatID: (statID) =>
    get().statProgressions.filter((progression) => progression.statID === Number(statID)),

  clearStatProgressions: () =>
    set({
      statProgressions: [],
      statProgressionsLoading: false,
      statProgressionsError: null,
    }),

  loadStats: async () => {
    set({ statsLoading: true, statsError: null })

    try {
      const stats = await getAllStats()
      set({ stats, statsLoading: false })
      return stats
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load stats'
      set({ statsError: message, statsLoading: false })
      throw error
    }
  },

  setStats: (stats) => set({ stats }),

  getStatByStatID: (statID) =>
    get().stats.find((stat) => stat.statID === Number(statID)) ?? null,

  clearStats: () => set({ stats: [], statsLoading: false, statsError: null }),

  loadTalents: async () => {
    const { talentsLoading, talentsLoaded, talents } = get()

    if (talentsLoading) {
      return talents
    }

    if (talentsLoaded) {
      return talents
    }

    set({ talentsLoading: true, talentsError: null })

    try {
      const nextTalents = await getAllTalents()
      set({ talents: nextTalents, talentsLoading: false, talentsLoaded: true })
      return nextTalents
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load talents'
      set({ talentsError: message, talentsLoading: false, talentsLoaded: true })
      throw error
    }
  },

  setTalents: (talents) => set({ talents }),

  upsertTalent: (talent) =>
    set((state) => {
      const index = state.talents.findIndex((entry) => entry.talentID === talent.talentID)

      if (index >= 0) {
        const talents = [...state.talents]
        talents[index] = talent
        return { talents }
      }

      return {
        talents: [...state.talents, talent].sort(
          (left, right) => left.talentID - right.talentID,
        ),
      }
    }),

  getTalentByTalentID: (talentID) =>
    get().talents.find((talent) => talent.talentID === Number(talentID)) ?? null,

  getTalentsByBloodlineID: (bloodlineID) =>
    get().talents.filter((talent) => talent.talentBloodlineID === Number(bloodlineID)),

  clearTalents: () =>
    set({ talents: [], talentsLoading: false, talentsError: null, talentsLoaded: false }),

  loadPrereqs: async () => {
    const { prereqsLoading, prereqsLoaded, prereqs } = get()

    if (prereqsLoading) {
      return prereqs
    }

    if (prereqsLoaded) {
      return prereqs
    }

    set({ prereqsLoading: true, prereqsError: null })

    try {
      const nextPrereqs = await getAllPrereqs()
      set({ prereqs: nextPrereqs, prereqsLoading: false, prereqsLoaded: true })
      return nextPrereqs
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load prereqs'
      set({ prereqsError: message, prereqsLoading: false, prereqsLoaded: true })
      throw error
    }
  },

  setPrereqs: (prereqs) => set({ prereqs }),

  upsertPrereq: (prereq) =>
    set((state) => {
      const index = state.prereqs.findIndex((entry) => entry.prereqID === prereq.prereqID)

      if (index >= 0) {
        const prereqs = [...state.prereqs]
        prereqs[index] = prereq
        return { prereqs }
      }

      return {
        prereqs: [...state.prereqs, prereq].sort(
          (left, right) => left.prereqID - right.prereqID,
        ),
      }
    }),

  getPrereqByPrereqID: (prereqID) =>
    get().prereqs.find((prereq) => prereq.prereqID === Number(prereqID)) ?? null,

  clearPrereqs: () =>
    set({ prereqs: [], prereqsLoading: false, prereqsError: null, prereqsLoaded: false }),

  loadRowStatuses: async () => {
    const { rowStatusesLoading, rowStatusesLoaded, rowStatuses } = get()

    if (rowStatusesLoading) {
      return rowStatuses
    }

    if (rowStatusesLoaded) {
      return rowStatuses
    }

    set({ rowStatusesLoading: true, rowStatusesError: null })

    try {
      const nextRowStatuses = await getAllRowStatuses()
      set({
        rowStatuses: nextRowStatuses,
        rowStatusesLoading: false,
        rowStatusesLoaded: true,
      })
      return nextRowStatuses
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load row statuses'
      set({ rowStatusesError: message, rowStatusesLoading: false, rowStatusesLoaded: true })
      throw error
    }
  },

  getRowStatusByRowStatusID: (rowStatusID) =>
    get().rowStatuses.find((status) => status.rowStatusID === Number(rowStatusID)) ??
    null,

  getRowStatusName: (rowStatusID) => {
    if (rowStatusID === null || rowStatusID === undefined || rowStatusID === '') {
      return '—'
    }

    return get().getRowStatusByRowStatusID(rowStatusID)?.statusName ?? '—'
  },

  clearRowStatuses: () =>
    set({
      rowStatuses: [],
      rowStatusesLoading: false,
      rowStatusesError: null,
      rowStatusesLoaded: false,
    }),

  loadLores: async () => {
    const { loresLoading, loresLoaded, lores } = get()

    if (loresLoading) {
      return lores
    }

    if (loresLoaded) {
      return lores
    }

    set({ loresLoading: true, loresError: null })

    try {
      const nextLores = await getAllLores()
      set({ lores: nextLores, loresLoading: false, loresLoaded: true })
      return nextLores
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load lores'
      set({ loresError: message, loresLoading: false, loresLoaded: true })
      throw error
    }
  },

  getLoreByLoreID: (loreID) =>
    get().lores.find((lore) => lore.loreID === Number(loreID)) ?? null,

  clearLores: () =>
    set({ lores: [], loresLoading: false, loresError: null, loresLoaded: false }),

  loadFormats: async () => {
    const { formatsLoading, formatsLoaded, formats } = get()

    if (formatsLoading) {
      return formats
    }

    if (formatsLoaded) {
      return formats
    }

    set({ formatsLoading: true, formatsError: null })

    try {
      const nextFormats = await getAllFormats()
      set({ formats: nextFormats, formatsLoading: false, formatsLoaded: true })
      return nextFormats
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load formats'
      set({ formatsError: message, formatsLoading: false, formatsLoaded: true })
      throw error
    }
  },

  getFormatByFormatID: (formatID) =>
    get().formats.find((format) => format.formatID === Number(formatID)) ?? null,

  clearFormats: () =>
    set({ formats: [], formatsLoading: false, formatsError: null, formatsLoaded: false }),
}))
