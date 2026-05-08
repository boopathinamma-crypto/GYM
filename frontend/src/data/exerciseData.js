/**
 * exerciseData.js
 * Complete exercise database with:
 * - YouTube video IDs for animation
 * - Muscle groups targeted
 * - Equipment needed
 * - Tips and instructions
 */

export const EXERCISE_DB = {
    // ─── CHEST ──────────────────────────────────────────────────────────────────
    'Barbell Bench Press': { yt: 'rT7DgCr-3pg', muscle: 'Chest', equipment: 'Barbell', tips: 'Keep shoulder blades retracted, feet flat on floor' },
    'Incline Barbell Bench Press': { yt: 'SrqOu55lrYU', muscle: 'Upper Chest', equipment: 'Barbell', tips: '30–45° incline, control the descent' },
    'Decline Bench Press': { yt: 'LfyQTdGjK40', muscle: 'Lower Chest', equipment: 'Barbell', tips: 'Secure feet, full range of motion' },
    'Dumbbell Bench Press': { yt: 'VmB1G1K7v94', muscle: 'Chest', equipment: 'Dumbbells', tips: 'Neutral wrists, squeeze chest at top' },
    'Incline Dumbbell Press': { yt: 'DbFgADa2PL8', muscle: 'Upper Chest', equipment: 'Dumbbells', tips: 'Control descent, feel full stretch' },
    'Chest Fly': { yt: 'eozdVDA78K0', muscle: 'Chest', equipment: 'Dumbbells', tips: 'Slight bend in elbows, hug a tree motion' },
    'Cable Crossover': { yt: 'taI4XduLpTk', muscle: 'Chest', equipment: 'Cable', tips: 'Cross hands at bottom, squeeze hard' },
    'Machine Chest Press': { yt: 'xUm0BiZCWlQ', muscle: 'Chest', equipment: 'Machine', tips: 'Adjust seat so handles align with mid-chest' },
    'Push-Ups': { yt: '_l3ySVKYVJ8', muscle: 'Chest + Triceps', equipment: 'Bodyweight', tips: 'Core tight, full range of motion' },
    'Dips': { yt: '2z8JmcrW-As', muscle: 'Chest + Triceps', equipment: 'Parallel Bars', tips: 'Lean forward for chest, upright for triceps' },

    // ─── TRICEPS ─────────────────────────────────────────────────────────────────
    'Triceps Pushdown': { yt: '2-LAMcpzODU', muscle: 'Triceps', equipment: 'Cable', tips: 'Elbows pinned to sides, full extension' },
    'Overhead Triceps Extension': { yt: 'YbX7Wd8jQ-Q', muscle: 'Triceps Long Head', equipment: 'Dumbbell', tips: 'Keep upper arms still, extend fully' },
    'Skull Crushers': { yt: 'd_KpxHAnwi8', muscle: 'Triceps', equipment: 'Barbell/EZ Bar', tips: 'Lower bar to forehead, elbows pointing up' },
    'Close Grip Bench Press': { yt: 'nEF0bv2FW7s', muscle: 'Triceps + Chest', equipment: 'Barbell', tips: 'Hands shoulder-width, elbows close to body' },
    'Dumbbell Kickbacks': { yt: 'tKjcgfu44sI', muscle: 'Triceps', equipment: 'Dumbbell', tips: 'Upper arm parallel to floor, full extension' },
    'Rope Pushdown': { yt: 'vB5OHsJ3EME', muscle: 'Triceps', equipment: 'Cable + Rope', tips: 'Spread rope at bottom, squeeze triceps' },
    'Bench Dips': { yt: 'c3ZGl4pnIYI', muscle: 'Triceps', equipment: 'Bench', tips: 'Keep hips close to bench, lower slowly' },
    'Single Arm Cable Extension': { yt: 'nRiJVZDpdL0', muscle: 'Triceps', equipment: 'Cable', tips: 'One arm at a time for balanced development' },
    'EZ Bar Skull Crushers': { yt: 'd_KpxHAnwi8', muscle: 'Triceps', equipment: 'EZ Bar', tips: 'EZ bar reduces wrist strain vs straight bar' },
    'Diamond Push-Ups': { yt: 'J0DnG1_S92I', muscle: 'Triceps', equipment: 'Bodyweight', tips: 'Hands form diamond shape under chest' },

    // ─── BACK ────────────────────────────────────────────────────────────────────
    'Pull-Ups': { yt: 'eGo4IYlbE5g', muscle: 'Lats + Biceps', equipment: 'Pull-up Bar', tips: 'Full hang, drive elbows to hips' },
    'Lat Pulldown': { yt: 'CAwf7n6Luuc', muscle: 'Lats', equipment: 'Cable Machine', tips: 'Pull to upper chest, lean slightly back' },
    'Barbell Row': { yt: '9efgcAjQe7E', muscle: 'Back', equipment: 'Barbell', tips: 'Hinge at hips, pull to lower chest' },
    'Seated Cable Row': { yt: 'GZbfZ033f74', muscle: 'Mid Back', equipment: 'Cable', tips: 'Drive elbows back, squeeze shoulder blades' },
    'T-Bar Row': { yt: 'j3Igk5nyZE4', muscle: 'Mid Back', equipment: 'T-Bar', tips: 'Chest against pad, full range of motion' },
    'Single Arm Dumbbell Row': { yt: 'pYcpY20QaE8', muscle: 'Lats', equipment: 'Dumbbell', tips: 'Support with free hand, pull to hip' },
    'Straight Arm Pulldown': { yt: 'fIWP-FRFNU0', muscle: 'Lats', equipment: 'Cable', tips: 'Arms straight, feel full lat stretch at top' },
    'Machine Row': { yt: 'xQNkFl-b1LQ', muscle: 'Back', equipment: 'Machine', tips: 'Adjust seat, neutral spine throughout' },
    'Reverse Grip Pulldown': { yt: 'CAwf7n6Luuc', muscle: 'Lower Lats', equipment: 'Cable Machine', tips: 'Supinated grip hits lower lats harder' },
    'Rack Pull': { yt: 'G9U6oYBz0rE', muscle: 'Back + Traps', equipment: 'Barbell', tips: 'Bar set at knee height, partial deadlift' },

    // ─── BICEPS ──────────────────────────────────────────────────────────────────
    'Barbell Curl': { yt: 'ykJmrZ5v0Oo', muscle: 'Biceps', equipment: 'Barbell', tips: 'No swinging, full supination at top' },
    'Dumbbell Curl': { yt: 'sAq_ocpRh_I', muscle: 'Biceps', equipment: 'Dumbbells', tips: 'Rotate wrist outward as you curl' },
    'Hammer Curl': { yt: 'zC3nLlEvin4', muscle: 'Brachialis + Biceps', equipment: 'Dumbbells', tips: 'Neutral grip throughout, controlled tempo' },
    'Preacher Curl': { yt: 'fIWP-FRFNU0', muscle: 'Biceps Peak', equipment: 'EZ Bar + Bench', tips: 'Full extension at bottom, slow negative' },
    'Cable Curl': { yt: 'NFzTWp2qpiE', muscle: 'Biceps', equipment: 'Cable', tips: 'Constant tension, great for mind-muscle' },
    'Incline Dumbbell Curl': { yt: 'soxrZlIl35U', muscle: 'Long Head Biceps', equipment: 'Dumbbells', tips: 'Incline stretches long head for peak' },
    'Concentration Curl': { yt: 'Jvj2wV0vOYU', muscle: 'Biceps Peak', equipment: 'Dumbbell', tips: 'Elbow on inner thigh, squeeze hard at top' },
    'EZ Bar Curl': { yt: 'zG2i9AAlSlE', muscle: 'Biceps', equipment: 'EZ Bar', tips: 'Reduces wrist stress vs straight bar' },
    'Spider Curl': { yt: 'ObY9yOlSMxU', muscle: 'Biceps', equipment: 'Dumbbells', tips: 'Lean on incline bench, gravity isolates biceps' },
    'Reverse Curl': { yt: 'nThgzgmIXIQ', muscle: 'Brachioradialis', equipment: 'Barbell', tips: 'Overhand grip, builds forearm & bicep' },

    // ─── QUADS ───────────────────────────────────────────────────────────────────
    'Barbell Squat': { yt: 'ultWZbUMPL8', muscle: 'Quads + Glutes', equipment: 'Barbell', tips: 'Knees track over toes, break parallel' },
    'Front Squat': { yt: 'm4nysoMgDmg', muscle: 'Quads', equipment: 'Barbell', tips: 'Elbows high, upright torso' },
    'Leg Press': { yt: 'IZxyjW7MPJQ', muscle: 'Quads + Glutes', equipment: 'Machine', tips: 'Full range of motion, dont lock out knees' },
    'Hack Squat': { yt: 'EdtPDiMOioU', muscle: 'Quads', equipment: 'Machine', tips: 'Feet shoulder width, control descent' },
    'Bulgarian Split Squat': { yt: '2C-uNgKwPLE', muscle: 'Quads + Glutes', equipment: 'Dumbbells', tips: 'Rear foot elevated, front knee over toe' },
    'Walking Lunges': { yt: 'L8fvypPrzzs', muscle: 'Quads + Glutes', equipment: 'Dumbbells', tips: 'Long stride, back knee nearly touches floor' },
    'Leg Extension': { yt: 'm0FOpMEgero', muscle: 'Quads Isolation', equipment: 'Machine', tips: 'Full extension, control the negative' },
    'Step-Ups': { yt: 'dQqApCGd5Ss', muscle: 'Quads + Glutes', equipment: 'Box', tips: 'Full step, drive through heel' },
    'Sissy Squat': { yt: 'TEQCNaUCZ5c', muscle: 'Quads', equipment: 'Bodyweight', tips: 'Hold support, lean back, knees forward' },
    'Smith Machine Squat': { yt: 'Bn-HNfnvhbQ', muscle: 'Quads', equipment: 'Smith Machine', tips: 'Feet slightly forward for more glute activation' },

    // ─── SHOULDERS ───────────────────────────────────────────────────────────────
    'Overhead Barbell Press': { yt: '2yjwXTZbDtE', muscle: 'Shoulders', equipment: 'Barbell', tips: 'Bar from upper chest, lock out overhead' },
    'Dumbbell Shoulder Press': { yt: 'qEwKCR5JCog', muscle: 'Shoulders', equipment: 'Dumbbells', tips: 'Press to lockout, control on the way down' },
    'Arnold Press': { yt: '6Z15_WdXmVw', muscle: 'All Deltoids', equipment: 'Dumbbells', tips: 'Rotate palms during press for full recruitment' },
    'Lateral Raise': { yt: 'FeJbAYjE94s', muscle: 'Side Delts', equipment: 'Dumbbells', tips: 'Slight lean, pour water motion, no swinging' },
    'Front Raise': { yt: 'gkArHs4oz4M', muscle: 'Front Delts', equipment: 'Dumbbells', tips: 'Slightly bent elbows, raise to shoulder height' },
    'Reverse Pec Deck': { yt: 'Gs1A1Z-TGeM', muscle: 'Rear Delts', equipment: 'Machine', tips: 'Fly motion backward, squeeze rear delts' },
    'Face Pull': { yt: 'rep-qVOkqgk', muscle: 'Rear Delts + Rotator Cuff', equipment: 'Cable', tips: 'Pull to face level, external rotation' },
    'Cable Lateral Raise': { yt: 'PPMmFWS8eCE', muscle: 'Side Delts', equipment: 'Cable', tips: 'Cross-body cable keeps constant tension' },
    'Dumbbell Rear Delt Fly': { yt: 'EA7u4Q_8HQ0', muscle: 'Rear Delts', equipment: 'Dumbbells', tips: 'Bent over, raise arms out to sides' },
    'Upright Row': { yt: 'VGFse49D1GQ', muscle: 'Traps + Delts', equipment: 'Barbell', tips: 'Wide grip, elbows above hands' },

    // ─── SHRUGS / TRAPS ──────────────────────────────────────────────────────────
    'Barbell Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Barbell', tips: 'Straight up shrug, hold at top 1 second' },
    'Dumbbell Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Dumbbells', tips: 'Neutral grip, full range at bottom' },
    'Smith Machine Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Smith Machine', tips: 'Fixed bar path, focus on contraction' },
    'Behind Back Barbell Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps + Rear', equipment: 'Barbell', tips: 'Hits mid traps more than front shrug' },
    'Cable Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Cable', tips: 'Constant tension throughout the movement' },
    'Incline Dumbbell Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Dumbbells', tips: 'Lie face down on incline bench' },
    'Trap Bar Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Trap Bar', tips: 'Neutral grip, heavy load possible' },
    'Farmer Walk': { yt: 'rt0fleU-PcQ', muscle: 'Traps + Forearms + Core', equipment: 'Dumbbells', tips: 'Heavy weight, upright posture, long steps' },
    'Power Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps + Power', equipment: 'Barbell', tips: 'Slight leg drive for heavier loads' },
    'Plate Shrug': { yt: 'g6qbq4Lf1FI', muscle: 'Traps', equipment: 'Weight Plate', tips: 'Hold plate in front, arms extended' },

    // ─── DEADLIFT VARIATIONS ─────────────────────────────────────────────────────
    'Conventional Deadlift': { yt: 'op9kVnSso6Q', muscle: 'Full Posterior Chain', equipment: 'Barbell', tips: 'Bar over mid-foot, neutral spine, hips hinge' },
    'Sumo Deadlift': { yt: 'AweC3UaM14o', muscle: 'Quads + Glutes', equipment: 'Barbell', tips: 'Wide stance, toes out, upright torso' },
    'Romanian Deadlift': { yt: 'JCXUYuzwNrM', muscle: 'Hamstrings', equipment: 'Barbell', tips: 'Hinge at hips, slight knee bend, feel stretch' },
    'Stiff Leg Deadlift': { yt: 'JCXUYuzwNrM', muscle: 'Hamstrings', equipment: 'Barbell', tips: 'Straighter legs than RDL, greater stretch' },
    'Trap Bar Deadlift': { yt: 'JuwLqfXMn_E', muscle: 'Quads + Back', equipment: 'Trap Bar', tips: 'More upright torso, easier on lower back' },
    'Deficit Deadlift': { yt: 'op9kVnSso6Q', muscle: 'Full Posterior Chain', equipment: 'Barbell', tips: 'Stand on plate, increases range of motion' },
    'Snatch Grip Deadlift': { yt: 'op9kVnSso6Q', muscle: 'Upper Back + Hamstrings', equipment: 'Barbell', tips: 'Extra wide grip, more upper back activation' },
    'Single Leg Deadlift': { yt: 'JCXUYuzwNrM', muscle: 'Hamstrings + Balance', equipment: 'Dumbbell', tips: 'Hip hinge on one leg, core stability crucial' },
    'Paused Deadlift': { yt: 'op9kVnSso6Q', muscle: 'Full Posterior Chain', equipment: 'Barbell', tips: 'Pause just below knee for strength gains' },

    // ─── HAMSTRINGS ──────────────────────────────────────────────────────────────
    'Lying Leg Curl': { yt: '1Tq3QdYUuHs', muscle: 'Hamstrings', equipment: 'Machine', tips: 'Full extension at start, squeeze at top' },
    'Seated Leg Curl': { yt: 'ELOCsoDSmrg', muscle: 'Hamstrings', equipment: 'Machine', tips: 'Keep hips down, full range of motion' },
    'Glute Ham Raise': { yt: 'PssmTZKWVHc', muscle: 'Hamstrings + Glutes', equipment: 'GHR Machine', tips: 'Use hamstrings to pull body up' },
    'Good Morning': { yt: '-T6NKa_7hBo', muscle: 'Hamstrings + Lower Back', equipment: 'Barbell', tips: 'Bar on traps, hinge at hips, soft knees' },
    'Single Leg Curl': { yt: '1Tq3QdYUuHs', muscle: 'Hamstrings', equipment: 'Machine', tips: 'Unilateral for imbalance correction' },
    'Kettlebell Swing': { yt: 'YSxHifyI6s8', muscle: 'Hamstrings + Glutes', equipment: 'Kettlebell', tips: 'Hip hinge, not squat, explosive hip thrust' },
    'Cable Pull Through': { yt: 'GVzuLbECEbY', muscle: 'Hamstrings + Glutes', equipment: 'Cable', tips: 'Face away from cable, hinge movement' },
    'Nordic Curl': { yt: 'DyoR3UJxqOk', muscle: 'Hamstrings Eccentric', equipment: 'Partner/Anchor', tips: 'Hardest ham exercise, lower slowly' },
    'Hip Thrust': { yt: 'xDmFkJxPzeM', muscle: 'Glutes + Hamstrings', equipment: 'Barbell + Bench', tips: 'Drive hips up, squeeze glutes at top' },

    // ─── WARM-UP ─────────────────────────────────────────────────────────────────
    'Jumping Jacks': { yt: 'c4DAnQ6DtF8', muscle: 'Full Body Warm-up', equipment: 'Bodyweight', tips: '2 minutes, moderate pace to raise heart rate' },
    'Arm Circles': { yt: 'OMlbBhzPxC8', muscle: 'Shoulders + Warm-up', equipment: 'Bodyweight', tips: 'Both directions, 30 seconds each' },
    'High Knees': { yt: 'oDdkytliOqE', muscle: 'Hip Flexors + Cardio', equipment: 'Bodyweight', tips: 'Pump arms, drive knees to chest height' },
    'Bodyweight Squat': { yt: 'aclHkVaku9U', muscle: 'Quads + Warm-up', equipment: 'Bodyweight', tips: 'Full depth, dynamic movement' },
    'Jump Rope': { yt: '1BZM2avkMHI', muscle: 'Full Body Cardio', equipment: 'Jump Rope', tips: 'Land softly on balls of feet' },

    // ─── COOL-DOWN ────────────────────────────────────────────────────────────────
    'Hamstring Stretch': { yt: 'WCFCdxr3W4I', muscle: 'Hamstrings', equipment: 'Bodyweight', tips: 'Hold 30 seconds each leg, no bouncing' },
    'Quadriceps Stretch': { yt: 'oR5b_xdh7C4', muscle: 'Quads', equipment: 'Bodyweight', tips: 'Stand on one foot, hold 30 sec each side' },
    "Child's Pose": { yt: 'eqVMAPM00GM', muscle: 'Back + Hips', equipment: 'Yoga Mat', tips: 'Arms extended forward, breathe deeply' },
    'Standing Forward Bend': { yt: 'g7Uhp5tpfZo', muscle: 'Hamstrings + Spine', equipment: 'Bodyweight', tips: 'Slight knee bend, relax neck and shoulders' },
    'Shoulder Stretch': { yt: 'CRjGpbdVLpA', muscle: 'Shoulders', equipment: 'Bodyweight', tips: 'Cross arm across chest, hold 30 seconds' },
    'Neck Stretch': { yt: 'Ph2KDHMiTY8', muscle: 'Neck + Traps', equipment: 'Bodyweight', tips: 'Gentle tilt, never rotate forcefully' },
};

// ─── 6-Day Workout Plan ──────────────────────────────────────────────────────
export const SIX_DAY_PLAN = [
    {
        day: 'Monday',
        label: 'Chest & Triceps',
        color: '#e63946',
        icon: '💪',
        groups: [
            {
                name: 'Chest', icon: '🫁',
                exercises: [
                    'Barbell Bench Press', 'Incline Barbell Bench Press', 'Decline Bench Press',
                    'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Chest Fly',
                    'Cable Crossover', 'Machine Chest Press', 'Push-Ups', 'Dips',
                ],
            },
            {
                name: 'Triceps', icon: '💪',
                exercises: [
                    'Triceps Pushdown', 'Overhead Triceps Extension', 'Skull Crushers',
                    'Close Grip Bench Press', 'Dumbbell Kickbacks', 'Rope Pushdown',
                    'Bench Dips', 'Single Arm Cable Extension', 'EZ Bar Skull Crushers', 'Diamond Push-Ups',
                ],
            },
        ],
    },
    {
        day: 'Tuesday',
        label: 'Back & Biceps',
        color: '#4cc9f0',
        icon: '🏋️',
        groups: [
            {
                name: 'Back', icon: '🔙',
                exercises: [
                    'Pull-Ups', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'T-Bar Row',
                    'Single Arm Dumbbell Row', 'Straight Arm Pulldown', 'Machine Row',
                    'Reverse Grip Pulldown', 'Rack Pull',
                ],
            },
            {
                name: 'Biceps', icon: '💪',
                exercises: [
                    'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl',
                    'Incline Dumbbell Curl', 'Concentration Curl', 'EZ Bar Curl', 'Spider Curl', 'Reverse Curl',
                ],
            },
        ],
    },
    {
        day: 'Wednesday',
        label: 'Quads, Shoulders & Shrugs',
        color: '#57cc99',
        icon: '🦵',
        groups: [
            {
                name: 'Quads', icon: '🦵',
                exercises: [
                    'Barbell Squat', 'Front Squat', 'Leg Press', 'Hack Squat', 'Bulgarian Split Squat',
                    'Walking Lunges', 'Leg Extension', 'Step-Ups', 'Sissy Squat', 'Smith Machine Squat',
                ],
            },
            {
                name: 'Shoulders', icon: '🎯',
                exercises: [
                    'Overhead Barbell Press', 'Dumbbell Shoulder Press', 'Arnold Press', 'Lateral Raise',
                    'Front Raise', 'Reverse Pec Deck', 'Face Pull', 'Cable Lateral Raise',
                    'Dumbbell Rear Delt Fly', 'Upright Row',
                ],
            },
            {
                name: 'Shrugs', icon: '🏔️',
                exercises: [
                    'Barbell Shrug', 'Dumbbell Shrug', 'Smith Machine Shrug', 'Behind Back Barbell Shrug',
                    'Cable Shrug', 'Incline Dumbbell Shrug', 'Trap Bar Shrug', 'Farmer Walk',
                    'Power Shrug', 'Plate Shrug',
                ],
            },
        ],
    },
    {
        day: 'Thursday',
        label: 'Chest & Triceps (Variation)',
        color: '#ff6b35',
        icon: '🔄',
        groups: [
            {
                name: 'Chest (Variations)', icon: '🫁',
                exercises: [
                    'Incline Dumbbell Press', 'Dumbbell Bench Press', 'Cable Crossover', 'Chest Fly',
                    'Machine Chest Press', 'Decline Bench Press', 'Push-Ups', 'Dips',
                    'Incline Barbell Bench Press', 'Barbell Bench Press',
                ],
            },
            {
                name: 'Triceps (Variations)', icon: '💪',
                exercises: [
                    'Skull Crushers', 'Rope Pushdown', 'Bench Dips', 'Diamond Push-Ups',
                    'EZ Bar Skull Crushers', 'Close Grip Bench Press', 'Triceps Pushdown',
                    'Overhead Triceps Extension', 'Dumbbell Kickbacks', 'Single Arm Cable Extension',
                ],
            },
        ],
    },
    {
        day: 'Friday',
        label: 'Deadlift, Back & Biceps',
        color: '#ffd60a',
        icon: '🏆',
        groups: [
            {
                name: 'Deadlift Variations', icon: '🔩',
                exercises: [
                    'Conventional Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Stiff Leg Deadlift',
                    'Trap Bar Deadlift', 'Deficit Deadlift', 'Rack Pull', 'Snatch Grip Deadlift',
                    'Single Leg Deadlift', 'Paused Deadlift',
                ],
            },
            {
                name: 'Back', icon: '🔙',
                exercises: [
                    'Pull-Ups', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'T-Bar Row',
                    'Single Arm Dumbbell Row', 'Straight Arm Pulldown', 'Machine Row',
                    'Reverse Grip Pulldown', 'Rack Pull',
                ],
            },
            {
                name: 'Biceps', icon: '💪',
                exercises: [
                    'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl',
                    'Incline Dumbbell Curl', 'Concentration Curl', 'EZ Bar Curl', 'Spider Curl', 'Reverse Curl',
                ],
            },
        ],
    },
    {
        day: 'Saturday',
        label: 'Hamstrings & Shoulders',
        color: '#b5179e',
        icon: '🦿',
        groups: [
            {
                name: 'Hamstrings', icon: '🦵',
                exercises: [
                    'Romanian Deadlift', 'Lying Leg Curl', 'Seated Leg Curl', 'Glute Ham Raise',
                    'Good Morning', 'Single Leg Curl', 'Kettlebell Swing', 'Cable Pull Through',
                    'Nordic Curl', 'Hip Thrust',
                ],
            },
            {
                name: 'Shoulders', icon: '🎯',
                exercises: [
                    'Overhead Barbell Press', 'Dumbbell Shoulder Press', 'Arnold Press', 'Lateral Raise',
                    'Front Raise', 'Reverse Pec Deck', 'Face Pull', 'Cable Lateral Raise',
                    'Dumbbell Rear Delt Fly', 'Upright Row',
                ],
            },
        ],
    },
];

export const WARM_UP_EXERCISES = ['Jumping Jacks', 'Arm Circles', 'High Knees', 'Bodyweight Squat', 'Push-Ups', 'Jump Rope'];
export const COOL_DOWN_EXERCISES = ['Hamstring Stretch', 'Quadriceps Stretch', "Child's Pose", 'Standing Forward Bend', 'Shoulder Stretch', 'Neck Stretch'];