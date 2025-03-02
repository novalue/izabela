<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Dictionary</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Dictionary</NvText>
              <NvText>Provide the definition of a word to improve its pronunciation</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <NvGroup justify="apart">
                <NvText type="label">Enable dictionary</NvText>
                <NvSwitch
                  :modelValue="dictionaryStore.enableDictionary"
                  @update:modelValue="
                    (value) =>
                      dictionaryStore.$patch({
                        enableDictionary: value,
                      })
                  "
                />
              </NvGroup>
              <template v-if="dictionaryStore.enableDictionary">
                <NvDivider direction="horizontal" />
                <NvGroup justify="apart">
                  <NvText type="label">Only match exact word</NvText>
                  <NvSwitch
                    :modelValue="dictionaryStore.matchExactWord"
                    @update:modelValue="
                      (value) =>
                        dictionaryStore.$patch({
                          matchExactWord: value,
                        })
                    "
                  />
                </NvGroup>
                <NvDivider direction="horizontal" />
                <NvGroup justify="apart">
                  <NvText type="label">Case sensitive</NvText>
                  <NvSwitch
                    :modelValue="dictionaryStore.caseSensitive"
                    @update:modelValue="
                      (value) =>
                        dictionaryStore.$patch({
                          caseSensitive: value,
                        })
                    "
                  />
                </NvGroup>
                <NvDivider direction="horizontal" />
                <div>
                  <NvButton size="sm" @click="addDefinition()">Add definition</NvButton>
                </div>
                <NvDivider direction="horizontal" />
                <NvGroup class="w-full" grow no-wrap>
                  <NvText type="label" class="w-1/6">Hacked</NvText>
                  <NvDivider class="!grow-0 h-5" direction="vertical" />
                  <NvText type="label" class="w-1/6">Reveal</NvText>
                  <NvDivider class="!grow-0 h-5" direction="vertical" />
                  <NvText class="w-1/2" type="label">Word</NvText>
                  <NvDivider class="!grow-0 h-5" direction="vertical" />
                  <NvText class="w-1/2" type="label">Definition</NvText>
                  <NvDivider class="!grow-0 h-5" direction="vertical" />
                  <NvText class="!grow-0 invisible" icon-name="times"></NvText>
                </NvGroup>
                <template v-for="(definition, i) in definitions" :key="i">
                  <NvGroup class="w-full" grow no-wrap>
                    <NvGroup class="w-1/6" style="display: flex; justify-content: center; align-items: center;">
                      <NvSwitch
                        :modelValue="definition[2]"
                        @update:modelValue="(value) => updateDefinition(i, [definition[0], definition[1], value, definition[3]])"
                      />
                    </NvGroup>
                    <NvDivider class="!grow-0 h-5" direction="vertical" />
                    <NvGroup class="w-1/6" style="display: flex; justify-content: center; align-items: center;">
                      <NvSwitch
                        :modelValue="definition[3]"
                        @update:modelValue="(value) => updateDefinition(i, [definition[0], definition[1], definition[2], value])"
                      />
                    </NvGroup>
                    <NvDivider class="!grow-0 h-5" direction="vertical" />
                    <NvInput class="w-1/2"
                      :modelValue="definition[0]"
                      @update:modelValue="(value) => updateDefinition(i, [value, definition[1], definition[2], definition[3]])"
                    />
                    <NvDivider class="!grow-0 h-5" direction="vertical" />
                    <NvInput class="w-1/2"
                      :modelValue="definition[1]"
                      @update:modelValue="(value) => updateDefinition(i, [definition[0], value, definition[2], definition[3]])"
                    />
                    <NvButton
                      class="!grow-0"
                      icon-name="times"
                      size="xs"
                      type="plain"
                      @click="removeDefinition(i)"
                    />
                  </NvGroup>
                </template>
              </template>
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvDivider,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useDictionaryStore } from '@/features/dictionary/store'
import { storeToRefs } from 'pinia'

const dictionaryStore = useDictionaryStore()
const { addDefinition, removeDefinition, updateDefinition } = dictionaryStore
const { definitions } = storeToRefs(dictionaryStore)
</script>
