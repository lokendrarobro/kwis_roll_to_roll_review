/* tslint:disable:max-line-length */
import { FuseNavigationItem } from '@fuse/components/navigation';
import Swal from 'sweetalert2';


export const defaultNavigation: FuseNavigationItem[] = [
    {
        id      : '1',
        title   : 'rolls',
        type    : 'basic',
        icon    : 'heroicons_outline:home',
        link    : '/dashboards/roll'
       
    },{

        id   : '2',
        title: 'roll_details',
        type : 'basic',
        icon : 'heroicons_outline:book-open',
        link    : '/roll-details',
        meta: {
            swalKey: 'please_select_roll_id_from_rolls_page'
        }
    },
    {
        id   : '3',
        title: 'review',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link    : '/review',
        meta: {
            swalKey: 'please_select_roll_from_roll_details_page'
        }
    },
    {
        id      : '5',
        title   : 'repair',
        type    : 'basic',
        icon    : 'heroicons_outline:chart-pie',
        link : '/repair',
        meta: {
            swalKey: 'please_select_roll_from_roll_details_page'
        }
       
    },
    {
        id      : '6',
        title   : 'ai_agent',
        type    : 'basic',
        icon    : 'heroicons_outline:cube',
        link    : '/model-list'
       
    },
    {
        id      : '7',
        title   : 'settings',
        type    : 'basic',
        icon    : 'heroicons_outline:cog',
        link    : '/settings'
       
    },
  
   
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
