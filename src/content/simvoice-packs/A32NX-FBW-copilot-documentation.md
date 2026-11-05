---
title: A32NX FBW Copilot Documentation
description: Voice commands, procedures, door responses, and known limitations for the FlyByWire A32NX SimVoice Copilot community pack.
updatedAt: 2026-11-05
packVersion: 1.0.0
---

Companion to the **A32NX-FBW-Copilot** community pack for the FlyByWire A32NX in Microsoft Flight Simulator. The packaged profile is named **a32nx_pilot_monitoring (imported)**; SimVoice may rename it to avoid a conflict during import.

**Scope:** simulator use only. This describes the supplied configuration, not an approved aircraft checklist or a complete airline SOP. You remain responsible for flying, configuration decisions, and checking cockpit indications.

**Documentation snapshot:** 5 November 2026. Covers the voice profile, advanced actions, and command groups supplied in pack version **1.0.0**. Simulator execution and speech recognition have not been tested. The pack also includes keyboard commands and SimVar call-outs, which are outside this guide's scope.

## Contents

- [Quick start](#quick-start)
- [Voice command reference](#voice-command-reference)
- [Command groups and procedures](#command-groups-and-procedures)
- [Troubleshooting](#troubleshooting)
- [Additional advanced actions](#additional-advanced-actions)

## Quick start

Speak the phrases shown in backticks. Spelling and capitalization below preserve the configured keys; the recognition engine's treatment of capitalization, acronyms, or alternative wording has not been verified.

| Task | Configured phrase | What to expect |
|---|---|---|
| Put both batteries in AUTO | `power up the aircraft` | BAT 1 AUTO, then BAT 2 AUTO; no external power selection |
| Request an APU start | `start auxiliary power` | APU master ON, then START; no availability wait |
| Select NAV on all three ADIRS selectors | `start inertial alignment` | IR 1, IR 2, then IR 3 NAV; no alignment completion check |
| Display a system page | `ECAM Fuel` | Selects the ECAM fuel page |
| Inspect configured door states | `doors check` | Selects the door page and conditionally speaks status |
| Lower gear on your command | `gear down` | Sends the gear-down event; verify cockpit indication |
| Select flap configuration 1 | `flaps one` | Sends FLAPS_1; verify indication and appropriate speed |

Use individual commands when a group includes settings you do not want. Do not repeat a group blindly: some actions toggle rather than set a state.

## Voice command reference

All 56 direct entries have an empty `Phases` array: there is no phase restriction configured in these entries. This does not mean that every command is appropriate in every phase.

The target column names the advanced action exactly as stored, without the `ADVANCED_ACTION:` routing prefix. Effects are derived from the configured event, variable write, or expression, not from a successful simulator test.

### Electrical power, APU, and ADIRS

| Say | Advanced action target | Configured effect |
|---|---|---|
| `battery one auto` | `A32NX BAT 1 AUTO` | BAT 1 AUTO |
| `battery two auto` | `A32NX BAT 2 AUTO` | BAT 2 AUTO |
| `external power on` | `A32NX External Power ON` | External power ON request; availability is not checked |
| `APU master on` | `A32NX APU Master ON` | APU master ON |
| `start APU` | `A32NX APU Start` | APU START control ON; does not first set master ON |
| `APU bleed off` | `A32NX APU Bleed OFF` | APU bleed OFF |
| `ADIRS one nav` | `A32NX ADIRS 1 NAV` | IR 1 selector NAV |
| `ADIRS two nav` | `A32NX ADIRS 2 NAV` | IR 2 selector NAV |
| `ADIRS three nav` | `A32NX ADIRS 3 NAV` | IR 3 selector NAV |

### Flaps, gear, spoilers, braking, and packs

| Say | Advanced action target | Configured effect |
|---|---|---|
| `flaps up` | `A32NX Flaps UP` | FLAPS_UP |
| `flaps one` | `A32NX Flaps 1` | FLAPS_1 |
| `flaps two` | `A32NX Flaps 2` | FLAPS_2 |
| `flaps three` | `A32NX Flaps 3` | FLAPS_3 |
| `gear up` | `A32NX Gear UP` | GEAR_UP |
| `gear down` | `A32NX Gear DOWN` | GEAR_DOWN |
| `arm ground spoilers` | `A32NX Arm Ground Spoilers` | SPOILERS_ARM_ON |
| `disarm ground spoilers` | `A32NX Disarm Ground Spoilers` | SPOILERS_ARM_OFF |
| `autobrake low` | `A32NX Autobrake LOW` | A32NX.AUTOBRAKE_SET_LO |
| `autobrake medium` | `A32NX Autobrake MED` | A32NX.AUTOBRAKE_SET_MED |
| `autobrake max` | `A32NX Autobrake MAX` | A32NX.AUTOBRAKE_SET_MAX |
| `Brake fan on` | `A32NX Brake Fan ON` | Writes brake fan button variable to 1 |
| `Brake Fan Off` | `A32NX Brake Fan OFF` | Writes brake fan button variable to 0 |
| `Rudder trim reset` | `A32NX Rudder Trim reset` | RUDDER_TRIM_RESET event |
| `Pack two toggle` | `A32NX PACK 2 toggle` | Inverts PACK 2 state; repeating reverses the result |

### Exterior lights and seat belts

| Say | Advanced action target | Configured effect |
|---|---|---|
| `beacon on` | `A32NX Beacon ON` | Beacon ON event |
| `beacon off` | `A32NX Beacon OFF` | Beacon OFF event |
| `landing lights on` | `A32NX Landing Lights ON` | Extends and powers both landing lights |
| `landing lights off` | `A32NX Landing Lights OFF` | Turns off and retracts both landing lights |
| `nose light taxi` | `A32NX Nose Light TAXI` | Writes nose-light variable and ensures circuit 20 ON |
| `nose light takeoff` | `A32NX Nose Light TAKEOFF` | Ensures takeoff-light circuit 17 ON |
| `runway turnoff lights on` | `A32NX Runway Turnoff Lights ON` | Ensures circuits 21 and 22 ON |
| `runway turnoff lights off` | `A32NX Runway Turnoff Lights OFF` | Ensures circuits 21 and 22 OFF |
| `Strobes on` | `A32NX Strobes ON` | STROBES_ON |
| `Strobes off` | `A32NX Strobes OFF` | STROBES_OFF |
| `Seat belts on` | `A32NX Seat Belts ON` | Toggles seat-belt sign only if currently OFF |
| `Seat belts off` | `A32NX Seat Belts OFF` | Toggles seat-belt sign only if currently ON |

The nose-light actions do not explicitly turn off the other nose-light circuit. Do not assume either phrase fully normalizes the selector and both circuits.

### Radar, predictive windshear, TCAS, and barometric reference

| Say | Advanced action target | Configured effect |
|---|---|---|
| `radar on` | `A32NX Radar ON` | Writes weather-radar selector value 1, the same value as OFF |
| `radar off` | `A32NX Radar OFF` | Writes the same weather-radar selector value 1 |
| `PWS on` | `A32NX PWS ON` | Predictive windshear selector value 1 |
| `PWS off` | `A32NX PWS OFF` | Predictive windshear selector value 0 |
| `TCAS standby` | `A32NX TCAS STBY` | TCAS selector value 0 |
| `TCAS TA` | `A32NX TCAS TA` | TCAS selector value 1 |
| `TCAS TA RA` | `A32NX TCAS TA/RA` | TCAS selector value 2 |
| `FO baro standard` | `A32NX FO Baro STD` | Pulls right/FO EFIS barometric selector to STD; not the captain's selector |

### ECAM system pages

| Say | Advanced action target | Page index |
|---|---|---|
| `ECAM APU` | `A32NX ECAM APU` | 6 |
| `ECAM Bleed` | `A32NX ECAM Bleed` | 1 |
| `ECAM Cond` | `A32NX ECAM Conditioner` | 7 |
| `ECAM cruise` | `A32NX ECAM Cruise` | 12 |
| `ECAM Door` | `A32NX ECAM Door` | 8 |
| `ECAM Electricity` | `A32NX ECAM Electricity` | 3 |
| `ECAM flight controls` | `A32NX ECAM flight controls` | 10 |
| `ECAM Fuel` | `A32NX ECAM Fuel` | 5 |
| `ECAM Hydraulics` | `A32NX ECAM Hydraulics` | 4 |
| `ECAM Pressure` | `A32NX ECAM Pressure` | 2 |
| `ECAM STS` | `A32NX ECAM STS` | 11 |
| `ECAM Wheel` | `A32NX ECAM Wheel` | 9 |

These actions write both `A32NX_ECAM_SD_CURRENT_PAGE_INDEX` and `A32NX_ECAM_SD_PAGE_TO_DISPLAY`. Selecting a page is not a system check or a spoken checklist.

## Command groups and procedures

**Important:** most steps have no condition expression. These procedures do not enforce appropriate speed, positive climb, icing conditions, APU availability, or other prerequisites. Nine steps also have an action-type mismatch and may not execute as intended.

| Say | Group name | Configured sequence |
|---|---|---|
| `power up the aircraft` | A32NX Electrical Power Up | BAT 1 AUTO; BAT 2 AUTO |
| `start auxiliary power` | A32NX Start APU | APU master ON; APU START |
| `start inertial alignment` | A32NX Align ADIRS | ADIRS 1 NAV; ADIRS 2 NAV; ADIRS 3 NAV |
| `Perform pre-flight and cockpit setup` | Perform pre-flight and cockpit setup | Electrical Power Up; Start APU; Align ADIRS. Only group configured for `Preflight` |
| `doors check` | doors check | ECAM Door; forward cargo lock status; slides status; four cabin-door position checks and conditional speech |
| `Prepare for pushback and engine start` | Prepare for pushback and engine start | Beacon ON; ECAM Engine; ECAM Door; nested doors check |
| `Prepare for taxi` | Prepare for taxi | APU bleed OFF; engine 1 anti-ice ON; engine 2 anti-ice ON; wing anti-ice ON; flaps 1; rudder input 0; rudder trim reset; Radar ON; PWS ON; TCAS TA/RA; autobrake MAX; T.O. CONFIG press; release; nose light TAXI; runway turnoff lights OFF |
| `Check takeoff config` | Check takeoff config | T.O. CONFIG press; release |
| `Prepare for takeoff` | Prepare for takeoff | Nose light TAKEOFF; landing lights ON; strobes ON |
| `Prepare for initial climb` | Prepare for initial climb | Gear UP; flaps UP; spoilers disarm; PACK 1 toggle; PACK 2 toggle |
| `prepare for approach` | A32NX Approach PM Setup | Autobrake MED; landing lights ON; spoilers arm |
| `Prepare for landing` | Prepare for landing | Autobrake LOW; gear DOWN; spoilers arm; landing lights ON |
| `Clear ECAM` | Clear ECAM | ECAM CLR release; press; release |
| `after landing cleanup` | A32NX After Landing PM Flow | Radar OFF; PWS OFF; TCAS STBY; flaps UP; nested Start APU |
| `Perform after landing procedure` | Perform after landing procedure | Nose light TAXI; landing lights OFF; strobes OFF; Radar OFF; PWS OFF; spoilers disarm; flaps UP; nested Start APU; ECAM Wheel |
| `Perform parking procedure` | Perform parking procedure | Beacon OFF; seat belts OFF; nested After Landing PM Flow: Radar OFF, PWS OFF, TCAS STBY, flaps UP, APU master ON, APU START |


## Troubleshooting

| Symptom | Check |
|---|---|
| Phrase not recognized | Confirm active profile, microphone/listening state, and the exact configured phrase. Do not assume aliases exist |
| Phrase recognized but nothing changes | Confirm simulator connection, loaded aircraft, action availability/enabled state, and aircraft-title scope. Inspect available application diagnostics |
| Direct command works but a procedure step does not | Check that command groups were included and inspect the affected step's action routing |
| Pre-flight group is unavailable | It is the only group with a configured `Preflight` phase; check the application's current phase |
| Radar does not turn on | ON and OFF write the same value; inspect the cockpit and verify/correct the selector mapping before relying on the command |
| Packs change unexpectedly | `Pack two toggle` and the initial-climb group invert current state. Check pack indications before repeating |
| No announcement while a door moves | Cabin-door speech requires exactly 0 or 1; intermediate positions have no matching response |
| Slides announcement disagrees with ECAM | Treat cockpit indication as authoritative; inspect the reversed speech conditions |
| APU start request does not produce an available APU | Check electrical supply, master state, start sequence, and cockpit indications. The profile does not wait for readiness |

Do not treat recognized speech, lack of an error, or a procedure finishing as proof that every requested setting was applied.

## Additional advanced actions

These 19 enabled definitions have **no direct phrase** in the top-level profile. Group references are identified below; the remaining definitions are not reached by any configured phrase or group.

| Advanced action name | Use in this configuration |
|---|---|
| `A32NX Anti Ice Engine 1 OFF` | Unbound; writes engine 1 anti-ice variable to 0 |
| `A32NX Anti Ice Engine 1 ON` | Taxi group; writes engine 1 anti-ice variable to 1 |
| `A32NX Anti Ice Engine 2 OFF` | Unbound; writes engine 2 anti-ice variable to 0 |
| `A32NX Anti Ice Engine 2 ON` | Taxi group; writes engine 2 anti-ice variable to 1 |
| `A32NX Anti Ice Wing OFF` | Unbound; conditional momentary wing anti-ice push |
| `A32NX Anti Ice Wing ON` | Taxi group; conditional momentary wing anti-ice push |
| `A32NX Cargo door locked` | Unbound; evaluates forward cargo lock variable |
| `A32NX Crew Oxygen OFF` | Unbound; writes crew oxygen variable to 1 |
| `A32NX Crew Oxygen ON` | Unbound; writes crew oxygen variable to 0 |
| `A32NX ECAM CLR pressed` | Clear ECAM group; configured CLR press event |
| `A32NX ECAM CLR released` | Clear ECAM group; configured CLR release event |
| `A32NX ECAM Engine` | Pushback preparation group; engine page index 0 |
| `A32NX PACK 1 toggle` | Initial-climb group; inverts PACK 1 |
| `A32NX rudder trim` | Unbound; expression is missing a closing parenthesis |
| `A32NX Rudder trim 0` | Taxi group; RUDDER_SET with parameter 0 |
| `A32NX Slides armed` | Unbound; evaluates cargo lock, not slides |
| `A32NX TO config pressed` | Taxi and takeoff-config groups; configured test press event |
| `A32NX TO config released` | Taxi and takeoff-config groups; configured test release event |
| `Rudder Trim Reset` | Unbound; writes `A32NX_RUDDER_TRIM_RESET_PRESSED` to 1 |