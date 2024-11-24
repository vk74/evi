<template>
  <div class="module-catalog">
    <v-container fluid>
      <v-row>
        <!-- Sheet для сервиса HPM -->
        <v-col cols="12" lg="6">
          <v-sheet class="mb-4 sheet-border" :class="{'compact-sheet': !reveals.HPM}" @click.stop="toggleSheet('HPM', true)" ref="HPM" elevation="1">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <div v-if="!reveals.HPM">
                    <h3>HPM > системы и сервисы госпитального мониторинга пациентов</h3>
                    <p>выбор конфигурации отдельного монитора пациента или системы мониторинга для целого отделения. услуги монтажа, обучения и сервисного обслуживания.</p>
                  </div>
                  <div v-else>
                    <h3>HPM - системы и сервисы госпитального мониторинга пациентов</h3>
                    <p>оборудование для мониторинга пациентов в отделениях реанимации и анестезиологии, от ведущего мирового производителя медицинских технологий.</p><br>
                    <br>
                    <v-divider></v-divider>
                    <h4 class="my-3">Заявки HPM</h4>
                    <v-row>
                      <!-- Карточки заявок для HPM -->
                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>новая ЦС</v-card-title>
                          <v-card-text>
                            <p>оценка стоимости новой станции мониторинга и принадлежностей</p><br>
                            <p>SLA: срок доставки оборудования ЦС 3 месяца, срок запуска в эксплуатацию 1 неделя</p>
                          </v-card-text>
                          <v-card-actions>
                            <v-btn color="primary">выбрать конфигурацию</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>обновление ЦС</v-card-title>
                          <v-card-text>
                            <p>оценка стоимости обновления смонтированной ЦС. для выполнения оценки необходимо предоставить серийный номер ЦС и выбрать желаемые сроки монтажа.</p><br>
                            <p>SLA: срок доставки оборудования ЦС 3 месяца, монтажные работы до 2 недель</p>
                          </v-card-text>
                          <v-card-actions>
                            <v-btn color="primary">сделать оценку</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>транспортный мониторинг</v-card-title>
                          <v-card-text>посчитать стоимость решения для оснащения клиники решением транспортного мониторинга</v-card-text>
                          <v-card-actions>
                            <v-btn color="primary">сделать оценку</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-sheet>
        </v-col>

        <!-- Новый Sheet для сервиса EMR -->
        <v-col cols="12" lg="6">
          <v-sheet class="mb-4 sheet-border" :class="{'compact-sheet': !reveals.EMR}" @click.stop="toggleSheet('EMR', true)" ref="EMR" elevation="1">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <div v-if="!reveals.EMR">
                    <h3>EMR</h3>
                    <p>оборудование для отделений реанимации и сервисы внедрения</p>
                  </div>
                  <div v-else>
                    <h3>EMR</h3>
                    <p>оборудование и комплексные системы для отделений реанимации, а также сервисы внедрения</p>
                    <p>SLA: доставка оборудования 6 месяцев. Внедрение от 6 месяцев</p>
                    <br>
                    <v-divider class="border-opacity-25"></v-divider>
                    <h4 class="my-3">Заявки EMR</h4>
                    <v-row>
                      <!-- Карточки заявок для EMR -->
                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>новая ЦР</v-card-title>
                          <v-card-text>оценка стоимости цифровой реанимации</v-card-text>
                          <v-card-actions>
                            <v-btn color="primary">выполнить расчет</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>демонстрация ЦР</v-card-title>
                          <v-card-text>проведение демонстрации работы ЦР</v-card-text>
                          <v-card-actions>
                            <v-btn color="primary">запросить демонстрацию</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-sheet>
        </v-col>

        <!-- Новый Sheet для тестового сервиса -->
        <v-col cols="12" lg="6">
          <v-sheet class="mb-4 sheet-border" :class="{'compact-sheet': !reveals.TST}" @click.stop="toggleSheet('TST', true)" ref="TST" elevation="1">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <div v-if="!reveals.TST">
                    <h3>EV2 Galactic Services</h3>
                    <p>услуги постройки колоний или отдельных строений на марсе, а скоро и на других планетах солнечной системы</p>
                  </div>
                  <div v-else>
                    <h3>EV2 Galactic Services</h3>
                    <p>устали от земных проблем? загрязнение, шум, пробки на дорогах? EV2 Galactic предлагает вам уникальный шанс начать всё с чистого листа – на Марсе! с нашим эксклюзивным сервисом постройки колоний, вы можете зарезервировать свой участок красной планеты уже сегодня и стать частью первой марсианской общины завтрашнего дня!</p>
                    <p>не пропустите возможность стать основателем нового мира. с EV2 Galactic ваша мечта о космических приключениях становится реальностью. запишитесь на консультацию с нашим межзвездным агентом уже сегодня и узнайте, как вы можете оставить свой след на песках Марса!</p>
                    <br>
                    <v-divider class="border-opacity-25"></v-divider>
                    <h3 class="my-3">наши услуги включают в себя:</h3>
                    <v-row>
                      <!-- Карточки заявок для TST -->
                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>постройка новой колонии</v-card-title>
                          <v-card-text>
                            <p>от экологичных подземных бункеров до шикарных купольных резиденций с видом на Олимпийскую планину – ваша марсианская колония будет построена точно под ваши предпочтения.</p><br>
                            <p>переосмыслите красный на красной планете! ландшафтный дизайн в подарок к колонии! забудьте о земных соседях, на Марсе ваш садовый гном будет единственным свидетелем ваших ботанических экспериментов!</p><br>
                            <p>SLA: готовность колонии к заселению за 2 земных месяца или меньше, частично зависит от расписания полетов Роскосмоса</p>
                          </v-card-text>
                          <v-card-actions>
                            <v-btn color="teal">выбрать опции и узнать стоимость</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>автономные системы</v-card-title>
                          <v-card-text>
                            <p>каждый дом EV2 Galactic оснащен собственной системой жизнеобеспечения, включая кислородные сады и замкнутые циклы водоснабжения, чтобы ваша новая жизнь была не только удивительной, но и устойчивой.</p><br>
                            <p>SLA: полностью роботизированый монтаж занимает не более 8 часов, или ваш следующий кислородный коктейль бесплатно! при выборе пакета с контролем качества от наших репликантов, гарантируем, что единственные жалобы будут от соседей, завидующих вашей идеальной траве. </p>
                          </v-card-text>
                          <v-card-actions>
                            <v-btn color="teal" @click="showModal">запросить демонстрацию системы</v-btn><br>

                          </v-card-actions>
                          <v-card-actions>
                            <v-btn color="teal">выбрать опции и забронировать</v-btn><br>
                          </v-card-actions>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6">
                        <v-card class="service-card">
                          <v-card-title>выбор места застройки</v-card-title>
                          <v-card-text>
                            <p>вы мечтали об участке с видом на Олимпийский Монс или предпочитаете уединенный кратер с идеальной акустикой для ваших вечеринок под звездами? наш сервис "марсианский риэлтор" поможет вам выбрать идеальное место для вашей будущей колонии, где соседи не будут жаловаться на шум, а виды на марсианский закат заставят ваши сердца замирать каждый вечер!</p> <br>
                            <p>за 1 сол поездки на марсоходе вы успеете посетить не менее десятка мест пригодных для застройки.</p><br>
                            <p>SLA: всегда 40 марсоходов на выбор, отмена брони возможна не менее чем за 48 земных часов до поездки.</p>
                          </v-card-text>
                          <v-card-actions>
                            <v-btn color="teal">забронировать марсоход</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-col>

                    </v-row>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-sheet>

        </v-col>
      </v-row>
    </v-container>
    <ModalRequestGalacticEcosystemDemo v-if="isModalOpen" @close="isModalOpen = false" />
  </div>
</template>

<script>
import ModalRequestGalacticEcosystemDemo from './ModalRequestGalacticEcosystemDemo.vue';

export default {
  name: 'ModuleCatalog',
  components: {
    ModalRequestGalacticEcosystemDemo
  },
  data() {
    return {
      reveals: {
        HPM: false,
        EMR: false,
        TST: false,
      },
      isModalOpen: false,
    };
  },
  methods: {
    toggleSheet(sheetId, state) {
      // Устанавливаем состояние для активного sheet и закрываем все остальные
      Object.keys(this.reveals).forEach(id => {
        this.reveals[id] = id === sheetId ? state : false;
      });
    },
    showModal() {
      this.isModalOpen = true;
    },
    handleClickOutside(event) {
      Object.keys(this.reveals).forEach(sheetId => {
        const refElement = this.$refs[sheetId].$el || this.$refs[sheetId];
        if (refElement && !refElement.contains(event.target)) {
          this.reveals[sheetId] = false;
        }
      });
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
}
</script>

<style>
.sheet-border {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.compact-sheet {
  /* max-width: 300px; /* Ширина Sheet в невыбранном состоянии */
}

.service-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.my-3 {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}

</style>